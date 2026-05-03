import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  Queues,
  GovernanceSyncJobData,
  GovernanceSyncJobResponse,
} from '../queue.types';
import { BlockfrostService } from '../blockfrost/blockfrost.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Drep } from '../entities/governance/drep.entity';
import { DrepDelegator } from '../entities/governance/drep-delegator.entity';
import { Proposal } from '../entities/governance/proposal.entity';
import { ProposalMetadata } from '../entities/governance/proposal-metadata.entity';
import { ProposalVote } from '../entities/governance/proposal-vote.entity';

@Injectable()
@Processor(Queues.GOVERNANCE_SYNC)
export class GovernanceSyncWorker extends WorkerHost {
  private readonly logger = new Logger(GovernanceSyncWorker.name);

  constructor(
    private readonly blockfrostService: BlockfrostService,
    @InjectDataSource('default')
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<GovernanceSyncJobData, GovernanceSyncJobResponse>): Promise<GovernanceSyncJobResponse> {
    this.logger.log(`Starting governance sync: ${job.id}`);

    try {
      const { forceRefresh = false, syncOnly } = job.data;
      let drepsCount = 0, proposalsCount = 0, votesCount = 0, delegatorsCount = 0;

      if (!syncOnly || syncOnly === 'dreps') drepsCount = await this.syncDReps();
      if (!syncOnly || syncOnly === 'delegators') {
        delegatorsCount = await this.syncDRepDelegators();
        await this.updateDelegationCounts();
      }
      if (!syncOnly || syncOnly === 'proposals') proposalsCount = await this.syncProposals();
      if (!syncOnly || syncOnly === 'metadata-votes') votesCount = await this.syncProposalMetadataAndVotes();

      this.logger.log(`Sync completed: ${drepsCount} DReps, ${delegatorsCount} delegators, ${proposalsCount} proposals, ${votesCount} votes`);

      return {
        success: true,
        message: 'Synced governance data',
        drepsCount, proposalsCount, votesCount, delegatorsCount,
      };
    } catch (error) {
      this.logger.error(`Sync failed: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  private async syncDReps(): Promise<number> {
    const drepsRepository = this.dataSource.getRepository(Drep);
    let page = 1, totalSynced = 0, hasMore = true;

    while (hasMore) {
      try {
        const drepsData = await this.blockfrostService.getAllDRepsWithPagination(page, 100, 'asc');
        if (!drepsData || drepsData.length === 0) break;

        for (const d of drepsData) {
          try {
            let detailedInfo: any = null, metadata: any = null;

            try {
              detailedInfo = await this.blockfrostService.getDRepInfo(d.drep_id);
              await new Promise(r => setTimeout(r, 50));
            } catch (e) {
              this.logger.warn(`DRep info failed (${d.drep_id}): ${e.message}`);
            }

            try {
              metadata = await this.blockfrostService.getDRepMetadata(d.drep_id);
              await new Promise(r => setTimeout(r, 50));
            } catch (e) {
              if (!e.message?.includes('404')) this.logger.warn(`DRep meta failed (${d.drep_id}): ${e.message}`);
            }

            await drepsRepository.upsert({
              drepId: d.drep_id,
              hex: d.hex,
              amountLovelace: (detailedInfo?.amount || d.amount || '0').toString(),
              active: detailedInfo?.active ?? true,
              activeEpoch: detailedInfo?.active_epoch || null,
              hasScript: detailedInfo?.has_script ?? d.has_script ?? false,
              retired: detailedInfo?.retired ?? d.retired ?? false,
              expired: detailedInfo?.expired ?? d.expired ?? false,
              lastActiveEpoch: detailedInfo?.last_active_epoch || null,
              metadata: metadata || null,
              votingPowerAda: detailedInfo?.amount ? (parseInt(detailedInfo.amount) / 1_000_000).toString() : null,
            }, { conflictPaths: ['drepId'], skipUpdateIfNoValuesChanged: true });
            totalSynced++;
          } catch (e) {
            this.logger.warn(`DRep upsert failed (${d.drep_id}): ${e.message}`);
          }
        }

        await new Promise(r => setTimeout(r, 100));
        if (drepsData.length < 100) hasMore = false;
        else page++;
      } catch (e) {
        this.logger.error(`DReps fetch failed (page ${page}): ${e.message}`);
        hasMore = false;
      }
    }
    return totalSynced;
  }

  private async syncDRepDelegators(): Promise<number> {
    const drepsRepository = this.dataSource.getRepository(Drep);
    const delegatorsRepository = this.dataSource.getRepository(DrepDelegator);
    const allDreps = await drepsRepository.find();
    let totalSynced = 0;

    for (const drep of allDreps) {
      const newDelegatorsMap = new Map<string, any>(); 
      let fetchFailed = false, page = 1, hasMore = true;

      while (hasMore) {
        try {
          const data = await this.blockfrostService.getDRepDelegators(drep.drepId, page, 100, 'asc');
          if (!data || data.length === 0) break;

          for (const d of data) newDelegatorsMap.set(d.address, d);
          await new Promise(r => setTimeout(r, 100));

          if (data.length < 100) hasMore = false;
          else page++;
        } catch (e) {
          this.logger.warn(`Delegators fetch failed (${drep.drepId}, page ${page}): ${e.message}`);
          fetchFailed = true;
          hasMore = false;
        }
      }

      if (fetchFailed) continue;

      const existing = await delegatorsRepository.find({ where: { drepId: drep.drepId } });
      const existingMap = new Map(existing.map(d => [d.stakeAddress, d]));

      const toInsert: any[] = [], toUpdate: any[] = [], toDeleteIds: string[] = [];

      for (const [address, newData] of newDelegatorsMap) {
        const ext = existingMap.get(address);
        if (!ext) {
          toInsert.push({ drepId: drep.drepId, stakeAddress: address, amountLovelace: newData.amount, votingPowerLovelace: newData.amount });
        } else if (ext.amountLovelace !== newData.amount) {
          toUpdate.push({ drepId: drep.drepId, stakeAddress: address, amountLovelace: newData.amount, votingPowerLovelace: newData.amount });
        }
      }

      for (const [address] of existingMap) {
        if (!newDelegatorsMap.has(address)) toDeleteIds.push(address);
      }

      try {
        await this.dataSource.transaction(async (manager) => {
          const repo = manager.getRepository(DrepDelegator);
          const chunkSize = 1000;

          if (toDeleteIds.length > 0) {
             for (let i = 0; i < toDeleteIds.length; i += chunkSize) {
               await repo.createQueryBuilder().delete().where("drepId = :dId", { dId: drep.drepId }).andWhere("stakeAddress IN (:...ids)", { ids: toDeleteIds.slice(i, i + chunkSize) }).execute();
             }
          }

          if (toInsert.length > 0) {
            for (let i = 0; i < toInsert.length; i += chunkSize) await repo.insert(toInsert.slice(i, i + chunkSize));
          }

          if (toUpdate.length > 0) {
             for (let i = 0; i < toUpdate.length; i += chunkSize) {
                await repo.upsert(toUpdate.slice(i, i + chunkSize), { conflictPaths: ['drepId', 'stakeAddress'], skipUpdateIfNoValuesChanged: true });
             }
          }
        });
        totalSynced += newDelegatorsMap.size;
      } catch (e) {
        this.logger.error(`Delegators sync failed (${drep.drepId}): ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 200));
    }
    return totalSynced;
  }

  private async syncProposals(): Promise<number> {
    const proposalsRepository = this.dataSource.getRepository(Proposal);
    let page = 1, totalSynced = 0, hasMore = true;

    while (hasMore) {
      try {
        const list = await this.blockfrostService.getAllProposals(page, 100, 'desc');
        if (!list || list.length === 0) break;

        for (const item of list) {
          try {
            const existing = await proposalsRepository.findOne({ where: { txHash: item.tx_hash, certIndex: item.cert_index } });
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
                id: data.id, txHash: data.tx_hash, certIndex: data.cert_index,
                governanceType: data.governance_type, governanceDescription: data.governance_description || null,
                depositLovelace: data.deposit || null, returnStakeAddress: data.return_address || null,
                ratifiedEpoch: data.ratified_epoch || null, enactedEpoch: data.enacted_epoch || null,
                droppedEpoch: data.dropped_epoch || null, expiredEpoch: data.expired_epoch || null,
                expirationEpoch: data.expiration || null, blockTime,
              }, { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true });
              totalSynced++;
            }
            await new Promise(r => setTimeout(r, 50));
          } catch (e) {
            this.logger.warn(`Proposal sync failed (${item.tx_hash}): ${e.message}`);
          }
        }

        if (list.length < 100) hasMore = false;
        else page++;
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        this.logger.error(`Proposals fetch failed (page ${page}): ${e.message}`);
        hasMore = false;
      }
    }
    return totalSynced;
  }

  private async syncProposalMetadataAndVotes(): Promise<number> {
    const proposalsRepository = this.dataSource.getRepository(Proposal);
    const metadataRepository = this.dataSource.getRepository(ProposalMetadata);
    const votesRepository = this.dataSource.getRepository(ProposalVote);

    const targets = await proposalsRepository.createQueryBuilder('p')
      .leftJoin(ProposalMetadata, 'm', 'm.proposalId = p.id')
      .where('m.proposalId IS NULL OR m.error IS NOT NULL')
      .limit(100).getMany();

    let totalVotesSynced = 0;
    for (const p of targets) {
      try {
        try {
          const meta = await this.blockfrostService.getProposalMetadata(p.txHash, p.certIndex);
          if (meta) {
            await metadataRepository.upsert({
              proposalId: p.id, url: meta.url, hash: meta.hash, jsonMetadata: meta.json_metadata,
              bytes: meta.bytes, version: 'v2', error: null,
            }, { conflictPaths: ['proposalId'], skipUpdateIfNoValuesChanged: true });
          }
        } catch (e) {
          if (e.status !== 429) {
            await metadataRepository.upsert({ proposalId: p.id, error: { message: e.message, status: e.status, ts: new Date().toISOString() }, version: 'v2' } as any, { conflictPaths: ['proposalId'], skipUpdateIfNoValuesChanged: false });
          }
        }

        try {
          let page = 1, hasMore = true, count = 0;
          while (hasMore && count < 500) {
            const data = await this.blockfrostService.getProposalVotes(p.txHash, p.certIndex, page, 100, 'asc');
            if (!data || data.length === 0) break;

            const upserts = data.map(v => ({ proposalId: p.id, txHash: v.tx_hash, certIndex: v.cert_index, voterRole: v.voter_role, voter: v.voter, vote: v.vote }));
            await votesRepository.upsert(upserts, { conflictPaths: ['proposalId', 'voter'], skipUpdateIfNoValuesChanged: true });

            count += data.length; totalVotesSynced += data.length;
            if (data.length < 100) hasMore = false;
            else page++;
            await new Promise(r => setTimeout(r, 50));
          }
        } catch (e) {
          this.logger.warn(`Votes sync failed (${p.id}): ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        this.logger.warn(`Meta/Votes sync failed (${p.id}): ${e.message}`);
      }
    }
    return totalVotesSynced;
  }

  private async updateDelegationCounts(): Promise<void> {
    const drepsRepository = this.dataSource.getRepository(Drep);
    const delegatorsRepository = this.dataSource.getRepository(DrepDelegator);

    const counts = await delegatorsRepository.createQueryBuilder('d')
      .select('d.drepId', 'drepId').addSelect('COUNT(*)', 'count')
      .groupBy('d.drepId').getRawMany();

    for (const c of counts) {
      try {
        await drepsRepository.update({ drepId: c.drepId }, { delegationVoteCount: parseInt(c.count) });
      } catch (e) {
        this.logger.warn(`Count update failed (${c.drepId}): ${e.message}`);
      }
    }
  }



  private async updateDelegationCounts(): Promise<void> {
    const drepsRepository = this.dataSource.getRepository(Drep);
    const delegatorsRepository = this.dataSource.getRepository(DrepDelegator);

    // Get count of delegators for each DRep
    const delegatorCounts = await delegatorsRepository
      .createQueryBuilder('delegator')
      .select('delegator.drepId', 'drepId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('delegator.drepId')
      .getRawMany();

    // Update each DRep with the delegation count
    for (const countData of delegatorCounts) {
      try {
        await drepsRepository.update(
          { drepId: countData.drepId },
          { delegationVoteCount: parseInt(countData.count) },
        );
      } catch (error) {
        this.logger.warn(
          `Failed to update delegation count for DRep ${countData.drepId}: ${error.message}`,
        );
      }
    }
  }
}
