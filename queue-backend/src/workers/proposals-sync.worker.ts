import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Queues, ProposalsSyncJobData, ProposalsSyncJobResponse } from '../queue.types';
import { BlockfrostService } from '../blockfrost/blockfrost.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Proposal } from '../entities/governance/proposal.entity';
import { ProposalMetadata } from '../entities/governance/proposal-metadata.entity';

@Injectable()
@Processor(Queues.PROPOSALS_SYNC)
export class ProposalsSyncWorker extends WorkerHost {
  private readonly logger = new Logger(ProposalsSyncWorker.name);

  constructor(
    private readonly blockfrostService: BlockfrostService,
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

            if (existing?.blockTime) continue; 

            const data = await this.blockfrostService.getProposal(item.tx_hash, item.cert_index);
            if (data) {
              let blockTime: Date | null = null;
              try {
                const tx = await this.blockfrostService.getTransaction(data.tx_hash);
                if (tx?.block_time) blockTime = new Date(tx.block_time * 1000);
              } catch (e) {
                this.logger.debug(`Tx time fetch failed for ${data.tx_hash}`);
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
      .limit(200)
      .getMany();

    if (targets.length === 0) return 0;

    let synced = 0;
    for (const p of targets) {
      try {
        const meta = await this.blockfrostService.getProposalMetadata(p.txHash, p.certIndex);
        if (meta) {
          await metadataRepository.upsert({
            proposalId: p.id,
            url: meta.url,
            hash: meta.hash,
            jsonMetadata: meta.json_metadata,
            bytes: meta.bytes,
            version: 'v2',
            error: null,
          }, { conflictPaths: ['proposalId'], skipUpdateIfNoValuesChanged: true });
          synced++;
        }
      } catch (e) {
        if (e.status !== 429) {
          await metadataRepository.upsert({
            proposalId: p.id,
            error: { message: e.message, status: e.status, ts: new Date().toISOString() },
            version: 'v2',
          }, { conflictPaths: ['proposalId'], skipUpdateIfNoValuesChanged: false });
        }
      }
      await new Promise(r => setTimeout(r, 100));
    }
    return synced;
  }


}
