import { ProviderDeferred } from '../blockfrost/request-budget';
import {
  batchDatabase,
  runBatch,
  syncItem,
  targets,
} from '../blockfrost/sync-run';
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
    token?: string,
  ): Promise<DrepVotesSyncJobResponse> {
    return runBatch(this.dataSource, job, token, async () => {
      this.logger.log(`Starting DRep votes sync: ${job.id}`);

      try {
        let total = 0,
          processed = 0;

        const drepsRepo = batchDatabase(this.dataSource).getRepository(Drep);
        const votesRepo = batchDatabase(this.dataSource).getRepository(
          ProposalVote,
        );

        const dreps = await targets('vote-dreps', () =>
          drepsRepo.find({ order: { drepId: 'ASC' } }),
        );

        for (const d of dreps) {
          total += await syncItem(`drep-votes:${d.drepId}`, async () => {
            let delta = 0;
            try {
              let page = 1,
                hasMore = true;

              while (hasMore) {
                try {
                  const data = await this.blockfrostService.getDRepVotes(
                    d.drepId,
                    page,
                    100,
                    'asc',
                  );
                  if (!data || data.length === 0) break;

                  for (const v of data) {
                    delta += await syncItem(
                      `vote:${d.drepId}:${v.tx_hash}:${v.cert_index}`,
                      async () => {
                        try {
                          const ext = await votesRepo.findOne({
                            where: {
                              txHash: v.tx_hash,
                              certIndex: v.cert_index,
                              voter: d.drepId,
                            },
                          });
                          if (ext?.blockTime) {
                            return 0;
                          }

                          let bt: Date | null = null;
                          try {
                            const tx =
                              await this.blockfrostService.getTransaction(
                                v.tx_hash,
                              );
                            if (tx?.block_time)
                              bt = new Date(tx.block_time * 1000);
                          } catch (e) {
                            if (e instanceof ProviderDeferred) throw e;

                            this.logger.debug('Tx fetch failed');
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

                          await new Promise((r) => setTimeout(r, 50));
                          return 1;
                        } catch (e) {
                          if (e instanceof ProviderDeferred) throw e;

                          this.logger.warn('Vote upsert failed');
                          throw e;
                        }
                      },
                    );
                  }

                  if (data.length < 100) hasMore = false;
                  else page++;

                  await new Promise((r) => setTimeout(r, 100));
                } catch (e) {
                  if (e instanceof ProviderDeferred) throw e;

                  if (e.status === 404) return 0;
                  this.logger.warn('Votes page failed');
                  throw e;
                }
              }

              {
                const count = await votesRepo.count({
                  where: { voter: d.drepId },
                });
                await drepsRepo.update(
                  { drepId: d.drepId },
                  { governanceVoteCount: count },
                );
              }

              if (processed % 50 === 0)
                this.logger.log(`Processed ${processed} DReps...`);
              await new Promise((r) => setTimeout(r, 100));
            } catch (e) {
              if (e instanceof ProviderDeferred) throw e;

              this.logger.warn('DRep sync failed');
              throw e;
            }

            return delta;
          });
          processed++;
        }

        return {
          success: true,
          message: 'Synced DRep votes',
          drepVotesCount: total,
          processedDreps: processed,
        };
      } catch (e) {
        if (e instanceof ProviderDeferred) throw e;

        this.logger.error('DRep sync failed');
        throw e;
      }
    });
  }
}
