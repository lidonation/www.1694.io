import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  Queues,
  DrepVotesSyncJobData,
  DrepVotesSyncJobResponse,
} from '../queue.types';
import { LOCK_DURATION_MEDIUM } from '../queue.constants';
import { BlockfrostService } from '../blockfrost/blockfrost.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Drep } from '../entities/governance/drep.entity';
import { ProposalVote } from '../entities/governance/proposal-vote.entity';

@Injectable()
@Processor(Queues.DREP_VOTES_SYNC, { lockDuration: LOCK_DURATION_MEDIUM })
export class DrepVotesSyncWorker extends WorkerHost {
  private readonly logger = new Logger(DrepVotesSyncWorker.name);

  constructor(
    private readonly blockfrostService: BlockfrostService,
    @InjectDataSource('default')
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(
    job: Job<DrepVotesSyncJobData, DrepVotesSyncJobResponse>,
  ): Promise<DrepVotesSyncJobResponse> {
    this.logger.log(`Starting DRep votes sync: ${job.id}`);

    try {
      const { forceRefresh = false } = job.data;
      let total = 0,
        processed = 0;

      const drepsRepo = this.dataSource.getRepository(Drep);
      const votesRepo = this.dataSource.getRepository(ProposalVote);

      const dreps = await drepsRepo.find({ order: { votingPowerAda: 'DESC' } });

      for (const d of dreps) {
        try {
          let page = 1,
            hasMore = true,
            synced = 0;

          while (hasMore) {
            try {
              const data = await this.blockfrostService.getDRepVotes(
                d.drepId,
                page,
                100,
                'desc',
              );
              if (!data || data.length === 0) break;

              let existingCount = 0;
              for (const v of data) {
                try {
                  const ext = await votesRepo.findOne({
                    where: {
                      txHash: v.tx_hash,
                      certIndex: v.cert_index,
                      voter: d.drepId,
                    },
                  });
                  if (ext?.blockTime) {
                    existingCount++;
                    continue;
                  }

                  let bt: Date | null = null;
                  try {
                    const tx = await this.blockfrostService.getTransaction(
                      v.tx_hash,
                    );
                    if (tx?.block_time) bt = new Date(tx.block_time * 1000);
                  } catch (e) {
                    this.logger.debug(`Tx fetch failed (${v.tx_hash})`);
                  }

                  await votesRepo.upsert(
                    {
                      proposalId:
                        v.proposal_id || `${v.tx_hash}_${v.cert_index}`,
                      txHash: v.tx_hash,
                      certIndex: v.cert_index,
                      voterRole: 'drep',
                      voter: d.drepId,
                      vote: v.vote,
                      blockTime: bt,
                    } as any,
                    {
                      conflictPaths: ['proposalId', 'voter'],
                      skipUpdateIfNoValuesChanged: true,
                    },
                  );

                  synced++;
                  total++;
                  await new Promise((r) => setTimeout(r, 50));
                } catch (e) {
                  this.logger.warn(
                    `Vote upsert failed (${d.drepId}): ${e.message}`,
                  );
                }
              }

              if (existingCount > 80 && !forceRefresh) hasMore = false;
              else if (data.length < 100) hasMore = false;
              else page++;

              await new Promise((r) => setTimeout(r, 100));
            } catch (e) {
              this.logger.warn(
                `Votes page ${page} failed (${d.drepId}): ${e.message}`,
              );
              hasMore = false;
            }
          }

          if (synced > 0) {
            const count = await votesRepo.count({ where: { voter: d.drepId } });
            await drepsRepo.update(
              { drepId: d.drepId },
              { governanceVoteCount: count },
            );
          }

          processed++;
          if (processed % 50 === 0)
            this.logger.log(`Processed ${processed} DReps...`);
          await new Promise((r) => setTimeout(r, 100));
        } catch (e) {
          this.logger.warn(`DRep sync failed (${d.drepId}): ${e.message}`);
        }
      }

      return {
        success: true,
        message: 'Synced DRep votes',
        drepVotesCount: total,
        processedDreps: processed,
      };
    } catch (e) {
      this.logger.error(`DRep sync failed: ${e.message}`, e.stack);
      return { success: false, message: e.message };
    }
  }
}
