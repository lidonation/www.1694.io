import { Processor, WorkerHost } from '@nestjs/bullmq';
import { LOCK_DURATION_HEAVY } from '../queue.constants';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Queues, ProposalsSyncJobData, ProposalsSyncJobResponse } from '../queue.types';
import { BlockfrostService } from '../blockfrost/blockfrost.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Proposal } from '../entities/governance/proposal.entity';
import { ProposalMetadata } from '../entities/governance/proposal-metadata.entity';
import { DrepTimelineEvent } from '../entities/governance/drep-timeline-event.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as blake from 'blakejs';

@Injectable()
@Processor(Queues.PROPOSALS_SYNC, { lockDuration: LOCK_DURATION_HEAVY })
export class ProposalsSyncWorker extends WorkerHost {
  private readonly logger = new Logger(ProposalsSyncWorker.name);

  constructor(
    private readonly blockfrostService: BlockfrostService,
    private readonly httpService: HttpService,
    @InjectDataSource('default')
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<ProposalsSyncJobData, ProposalsSyncJobResponse>): Promise<ProposalsSyncJobResponse> {
    this.logger.log(`Starting proposals sync: ${job.id}`);

    try {
      const proposalsCount = await this.syncProposals();
      const metadataCount = await this.syncProposalMetadata();

      this.logger.log(`Sync completed: ${proposalsCount} proposals, ${metadataCount} metadata`);

      return {
        success: true,
        message: `Synced ${proposalsCount} proposals, ${metadataCount} metadata`,
        proposalsCount,
        metadataCount,
      };
    } catch (error) {
      this.logger.error(`Sync failed: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  private async syncProposals(): Promise<number> {
    const proposalsRepository = this.dataSource.getRepository(Proposal);
    let page = 1;
    let totalSynced = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const proposalsListData = await this.blockfrostService.getAllProposals(page, 100, 'desc');
        if (!proposalsListData || proposalsListData.length === 0) break;

        for (const item of proposalsListData) {
          try {
            const existing = await proposalsRepository.findOne({
              where: { txHash: item.tx_hash, certIndex: item.cert_index }
            });

            // Skip only terminal states — enacted/expired/dropped will never change
            if (existing && (existing.enactedEpoch || existing.expiredEpoch || existing.droppedEpoch)) continue;

            const data = await this.blockfrostService.getProposal(item.tx_hash, item.cert_index);
            if (data) {
              let blockTime: Date | null = existing?.blockTime ?? null;
              if (!blockTime) {
                try {
                  const tx = await this.blockfrostService.getTransaction(data.tx_hash);
                  if (tx?.block_time) blockTime = new Date(tx.block_time * 1000);
                } catch (e) {
                  this.logger.debug(`Tx time fetch failed for ${data.tx_hash}`);
                }
              }

              await proposalsRepository.upsert({
                id: data.id,
                txHash: data.tx_hash,
                certIndex: data.cert_index,
                governanceType: data.governance_type,
                governanceDescription: data.governance_description || null,
                depositLovelace: data.deposit || null,
                returnStakeAddress: data.return_address || null,
                ratifiedEpoch: data.ratified_epoch || null,
                enactedEpoch: data.enacted_epoch || null,
                droppedEpoch: data.dropped_epoch || null,
                expiredEpoch: data.expired_epoch || null,
                expirationEpoch: data.expiration || null,
                blockTime,
              }, { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true });
              totalSynced++;
            }
            await new Promise(r => setTimeout(r, 50));
          } catch (e) {
            this.logger.warn(`Proposal sync failed (${item.tx_hash}): ${e.message}`);
          }
        }

        if (proposalsListData.length < 100) hasMore = false;
        else page++;

        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        this.logger.error(`Page ${page} fetch failed: ${e.message}`);
        hasMore = false;
      }
    }
    return totalSynced;
  }

  private async syncProposalMetadata(): Promise<number> {
    const proposalsRepository = this.dataSource.getRepository(Proposal);
    const metadataRepository = this.dataSource.getRepository(ProposalMetadata);

    const targets = await proposalsRepository.createQueryBuilder('p')
      .leftJoin(ProposalMetadata, 'm', 'm.proposalId = p.id')
      .where('m.proposalId IS NULL OR m.error IS NOT NULL')
      .limit(500)
      .getMany();

    if (targets.length === 0) return 0;

    let synced = 0;
    for (const p of targets) {
      try {
        let meta: any = null;
        let url: string | null = null;
        let hash: string | null = null;
        let jsonMetadata: any = null;

        try {
          meta = await this.blockfrostService.getProposalMetadata(p.txHash, p.certIndex);
          if (meta) {
            url = meta.url;
            hash = meta.hash;
            jsonMetadata = meta.json_metadata;
          }
        } catch (e) {
          if (e.status === 429) throw e; 
          this.logger.debug(`Blockfrost metadata 404 for ${p.id}, trying fallbacks...`);
        }

        if (!jsonMetadata) {
          const anchor = await this.getAnchorFromTimeline(p.txHash, p.certIndex);
          if (anchor) {
            url = anchor.url;
            hash = anchor.hash;
            jsonMetadata = await this.fetchMetadataManually(url, hash);
          }
        }

        if (jsonMetadata) {
          await metadataRepository.upsert({
            proposalId: p.id,
            url: url,
            hash: hash,
            jsonMetadata: jsonMetadata,
            bytes: meta?.bytes || null,
            version: 'v2',
            error: null,
          } as any, { conflictPaths: ['proposalId'], skipUpdateIfNoValuesChanged: true });
          synced++;
        } else if (url) {
          // We have a URL but failed to fetch or validate metadata
          await metadataRepository.upsert({
            proposalId: p.id,
            url: url,
            hash: hash,
            error: { message: 'Metadata fetch/validation failed', ts: new Date().toISOString() },
            version: 'v2',
          } as any, { conflictPaths: ['proposalId'], skipUpdateIfNoValuesChanged: false });
        } else {
          // No URL found anywhere
          await metadataRepository.upsert({
            proposalId: p.id,
            error: { message: 'No anchor URL found', status: 404, ts: new Date().toISOString() },
            version: 'v2',
          } as any, { conflictPaths: ['proposalId'], skipUpdateIfNoValuesChanged: false });
        }
      } catch (e) {
        this.logger.warn(`Metadata sync error for ${p.id}: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 100));
    }
    return synced;
  }

  private async getAnchorFromTimeline(txHash: string, certIndex: number) {
    try {
      const timelineRepository = this.dataSource.getRepository(DrepTimelineEvent);
      const actionId = `${txHash}#${certIndex}`;
      
      const event = await timelineRepository.createQueryBuilder('event')
        .where("event.eventType = 'proposal'")
        .andWhere("event.metadata->>'action_id' = :actionId", { actionId })
        .getOne();
        
      if (event?.metadata?.anchor_url) {
        return {
          url: event.metadata.anchor_url,
          hash: event.metadata.anchor_hash,
        };
      }
      
      // Try alternative metadata key
      if (event?.metadata?.url) {
         return {
           url: event.metadata.url,
           hash: event.metadata.hash,
         };
      }
      
      return null;
    } catch (error) {
      this.logger.debug(`Error getting anchor from timeline: ${error.message}`);
      return null;
    }
  }

  private async fetchMetadataManually(url: string, hash: string) {
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://dweb.link/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
    ];

    let urlsToTry: string[] = [];
    if (url.startsWith('ipfs://')) {
      const ipfsHash = url.replace('ipfs://', '');
      urlsToTry = gateways.map(g => `${g}${ipfsHash}`);
    } else {
      urlsToTry = [url];
    }

    for (const fetchUrl of urlsToTry) {
      try {
        let buffer: Buffer;

        if (url.startsWith('ipfs://') && fetchUrl === urlsToTry[0]) {
          const ipfsHash = url.replace('ipfs://', '');
          try {
            buffer = await this.blockfrostService.getIpfsContent(ipfsHash);
          } catch (e) {
            this.logger.debug(`Blockfrost IPFS fetch failed: ${e.message}`);
            continue; 
          }
        } else {
          this.logger.debug(`Fetching metadata manually from ${fetchUrl}`);
          const response = await firstValueFrom(this.httpService.get(fetchUrl, { 
            timeout: 10000,
            responseType: 'arraybuffer' 
          }));
          buffer = Buffer.from(response.data);
        }
        
        const hashedMetadata = blake.blake2bHex(new Uint8Array(buffer), undefined, 32);
        
        if (hashedMetadata !== hash) {
          this.logger.warn(`Manual metadata hash mismatch for ${fetchUrl}. Expected ${hash}, got ${hashedMetadata}`);
          continue; // Try next gateway or return null
        }

        try {
          return JSON.parse(buffer.toString('utf8'));
        } catch (e) {
          this.logger.warn(`Failed to parse metadata as JSON from ${fetchUrl}`);
          return null;
        }
      } catch (error) {
        this.logger.debug(`Manual metadata fetch failed for ${fetchUrl}: ${error.message}`);
      }
    }
    return null;
  }


}
