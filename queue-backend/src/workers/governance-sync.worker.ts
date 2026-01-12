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

  async process(
    job: Job<GovernanceSyncJobData, GovernanceSyncJobResponse>,
  ): Promise<GovernanceSyncJobResponse> {
    this.logger.log(`Starting governance sync job: ${job.id}`);

    try {
      const { forceRefresh = false, syncOnly } = job.data;

      let drepsCount = 0;
      let proposalsCount = 0;
      let votesCount = 0;
      let delegatorsCount = 0;

      // Sync DReps
      if (!syncOnly || syncOnly === 'dreps') {
        this.logger.log('Syncing DReps...');
        drepsCount = await this.syncDReps();
      }

      // Sync DRep Delegators
      if (!syncOnly || syncOnly === 'delegators') {
        this.logger.log('Syncing DRep delegators...');
        delegatorsCount = await this.syncDRepDelegators();

        // Update delegation counts on DReps
        this.logger.log('Updating delegation counts...');
        await this.updateDelegationCounts();
      }

      // Sync Proposals
      if (!syncOnly || syncOnly === 'proposals') {
        this.logger.log('Syncing proposals...');
        proposalsCount = await this.syncProposals();
      }

      // Sync Proposal Metadata and Votes
      if (!syncOnly || syncOnly === 'metadata-votes') {
        this.logger.log('Syncing proposal metadata and votes...');
        votesCount = await this.syncProposalMetadataAndVotes();
      }

      this.logger.log(
        `Governance sync completed: ${drepsCount} DReps, ${delegatorsCount} delegators, ${proposalsCount} proposals, ${votesCount} votes`,
      );

      return {
        success: true,
        message: `Successfully synced governance data`,
        drepsCount,
        proposalsCount,
        votesCount,
        delegatorsCount,
      };
    } catch (error) {
      this.logger.error(
        `Governance sync job failed: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        message: `Governance sync failed: ${error.message}`,
      };
    }
  }

  private async syncDReps(): Promise<number> {
    const drepsRepository = this.dataSource.getRepository(Drep);
    let page = 1;
    let totalSynced = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const drepsData =
          await this.blockfrostService.getAllDRepsWithPagination(
            page,
            100,
            'asc',
          );

        if (!drepsData || drepsData.length === 0) {
          hasMore = false;
          break;
        }

        for (const drepData of drepsData) {
          try {
            let detailedInfo: any = null;
            let metadata: any = null;

            try {
              detailedInfo = await this.blockfrostService.getDRepInfo(
                drepData.drep_id,
              );
              await new Promise((resolve) => setTimeout(resolve, 50));
            } catch (error) {
              this.logger.warn(
                `Failed to get detailed info for DRep ${drepData.drep_id}: ${error.message}`,
              );
            }

            try {
              metadata = await this.blockfrostService.getDRepMetadata(
                drepData.drep_id,
              );
              await new Promise((resolve) => setTimeout(resolve, 50));
            } catch (error) {
              if (
                !error.message?.includes('404') &&
                !error.message?.includes('Not Found')
              ) {
                this.logger.warn(
                  `Failed to get metadata for DRep ${drepData.drep_id}: ${error.message}`,
                );
              }
            }

            const drepEntity = {
              drepId: drepData.drep_id,
              hex: drepData.hex,
              amountLovelace: (
                detailedInfo?.amount ||
                drepData.amount ||
                '0'
              ).toString(),
              active: detailedInfo?.active ?? true,
              activeEpoch: detailedInfo?.active_epoch || null,
              hasScript:
                detailedInfo?.has_script ?? drepData.has_script ?? false,
              retired: detailedInfo?.retired ?? drepData.retired ?? false,
              expired: detailedInfo?.expired ?? drepData.expired ?? false,
              lastActiveEpoch: detailedInfo?.last_active_epoch || null,
              metadata: metadata || null,
              votingPowerAda: detailedInfo?.amount
                ? (parseInt(detailedInfo.amount) / 1_000_000).toString()
                : null,
            };

            await drepsRepository.upsert(drepEntity, {
              conflictPaths: ['drepId'],
              skipUpdateIfNoValuesChanged: true,
            });
            totalSynced++;
          } catch (drepError) {
            this.logger.warn(
              `Failed to upsert DRep ${drepData.drep_id}: ${drepError.message}`,
            );
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 100));

        if (drepsData.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (pageError) {
        this.logger.error(
          `Failed to fetch DReps page ${page}: ${pageError.message}`,
        );
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
      // 1. Fetch Phase: Get all new delegators from API
      const newDelegatorsMap = new Map<string, any>(); 
      let fetchFailed = false;

      let page = 1;
      let hasMore = true;

      this.logger.debug(`Fetching delegators for DRep ${drep.drepId}...`);
      
      while (hasMore) {
        try {
          const delegatorsData =
            await this.blockfrostService.getDRepDelegators(
              drep.drepId,
              page,
              100,
              'asc',
            );

          if (!delegatorsData || delegatorsData.length === 0) {
            hasMore = false;
            break;
          }

          for (const d of delegatorsData) {
            newDelegatorsMap.set(d.address, d);
          }

          // Rate limiting - wait 100ms between pages
          await new Promise((resolve) => setTimeout(resolve, 100));

          if (delegatorsData.length < 100) {
            hasMore = false;
          } else {
            page++;
          }
        } catch (pageError) {
          this.logger.warn(
            `Failed to fetch delegators page ${page} for DRep ${drep.drepId}: ${pageError.message}`,
          );
          fetchFailed = true;
          hasMore = false;
        }
      }

      if (fetchFailed) {
        this.logger.warn(`Skipping update for DRep ${drep.drepId} due to fetch errors. Existing data preserved.`);
        continue;
      }

      // 2. Load Phase: Get all existing delegators from DB
      const existingDelegators = await delegatorsRepository.find({
        where: { drepId: drep.drepId }
      });
      const existingDelegatorsMap = new Map(existingDelegators.map(d => [d.stakeAddress, d]));

      // 3. Diff Phase
      const toInsert: any[] = [];
      const toUpdate: any[] = [];
      const toDeleteIds: string[] = [];

      // Find inserts and updates
      for (const [address, newData] of newDelegatorsMap) {
        const existing = existingDelegatorsMap.get(address);
        if (!existing) {
          toInsert.push({
            drepId: drep.drepId,
            stakeAddress: address,
            amountLovelace: newData.amount,
            votingPowerLovelace: newData.amount, // Initial value
          });
        } else if (existing.amountLovelace !== newData.amount) {
          toUpdate.push({
            drepId: drep.drepId,
            stakeAddress: address,
            amountLovelace: newData.amount,
            votingPowerLovelace: newData.amount, // Reset VP if amount changes
          });
        }
      }

      // Find deletes
      for (const [address, existing] of existingDelegatorsMap) {
        if (!newDelegatorsMap.has(address)) {
          toDeleteIds.push(address);
        }
      }

      // 4. Execute Phase
      try {
        await this.dataSource.transaction(async (manager) => {
          const txRepo = manager.getRepository(DrepDelegator);

          // Batch Deletes
          if (toDeleteIds.length > 0) {
             // Delete in chunks
             const chunkSize = 1000;
             for (let i = 0; i < toDeleteIds.length; i += chunkSize) {
               const chunk = toDeleteIds.slice(i, i + chunkSize);
               await txRepo
                 .createQueryBuilder()
                 .delete()
                 .where("drepId = :drepId", { drepId: drep.drepId })
                 .andWhere("stakeAddress IN (:...ids)", { ids: chunk })
                 .execute();
             }
          }

          // Batch Inserts
          if (toInsert.length > 0) {
            const chunkSize = 1000;
            for (let i = 0; i < toInsert.length; i += chunkSize) {
              await txRepo.insert(toInsert.slice(i, i + chunkSize));
            }
          }

          // Batch Updates
          if (toUpdate.length > 0) {
             const chunkSize = 1000;
             for (let i = 0; i < toUpdate.length; i += chunkSize) {
                await txRepo.upsert(toUpdate.slice(i, i + chunkSize), {
                    conflictPaths: ['drepId', 'stakeAddress'],
                    skipUpdateIfNoValuesChanged: true 
                });
             }
          }
        });

        const syncedCount = newDelegatorsMap.size;
        totalSynced += syncedCount;
        this.logger.log(`Synced DRep ${drep.drepId}: ${toInsert.length} inserted, ${toUpdate.length} updated, ${toDeleteIds.length} deleted.`);

      } catch (txError) {
        this.logger.error(
          `Transaction failed for DRep ${drep.drepId}: ${txError.message}`,
          txError.stack
        );
      }
      
      //  200ms between DReps
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return totalSynced;
  }

  private async syncProposals(): Promise<number> {
    const proposalsRepository = this.dataSource.getRepository(Proposal);
    let page = 1;
    let totalSynced = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const proposalsListData = await this.blockfrostService.getAllProposals(
          page,
          100,
          'asc',
        );

        if (!proposalsListData || proposalsListData.length === 0) {
          hasMore = false;
          break;
        }

        for (const proposalListItem of proposalsListData) {
          try {
            // Get full proposal details using individual endpoint
            const proposalData = await this.blockfrostService.getProposal(
              proposalListItem.tx_hash,
              proposalListItem.cert_index,
            );

            if (proposalData) {
              await proposalsRepository.upsert(
                {
                  id: proposalData.id,
                  txHash: proposalData.tx_hash,
                  certIndex: proposalData.cert_index,
                  governanceType: proposalData.governance_type,
                  governanceDescription:
                    proposalData.governance_description || null,
                  depositLovelace: proposalData.deposit || null,
                  returnStakeAddress: proposalData.return_address || null,
                  ratifiedEpoch: proposalData.ratified_epoch || null,
                  enactedEpoch: proposalData.enacted_epoch || null,
                  droppedEpoch: proposalData.dropped_epoch || null,
                  expiredEpoch: proposalData.expired_epoch || null,
                  expirationEpoch: proposalData.expiration || null,
                },
                {
                  conflictPaths: ['id'],
                  skipUpdateIfNoValuesChanged: true,
                },
              );
              totalSynced++;
            }

            // Rate limiting between individual proposal requests
            await new Promise((resolve) => setTimeout(resolve, 50));
          } catch (proposalError) {
            this.logger.warn(
              `Failed to upsert proposal ${proposalListItem.tx_hash}/${proposalListItem.cert_index}: ${proposalError.message}`,
            );
          }
        }

        //wait 100ms between pages
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (proposalsListData.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (pageError) {
        this.logger.error(
          `Failed to fetch proposals page ${page}: ${pageError.message}`,
        );
        hasMore = false;
      }
    }

    return totalSynced;
  }

  private async syncProposalMetadataAndVotes(): Promise<number> {
    const proposalsRepository = this.dataSource.getRepository(Proposal);
    const metadataRepository = this.dataSource.getRepository(ProposalMetadata);
    const votesRepository = this.dataSource.getRepository(ProposalVote);

    const allProposals = await proposalsRepository.find();
    let totalVotesSynced = 0;

    for (const proposal of allProposals) {
      try {
        // Sync metadata
        try {
          const metadataData = await this.blockfrostService.getProposalMetadata(
            proposal.txHash,
            proposal.certIndex,
          );

          if (metadataData) {
            await metadataRepository.upsert(
              {
                proposalId: proposal.id,
                url: metadataData.url,
                hash: metadataData.hash,
                jsonMetadata: metadataData.json_metadata,
                bytes: metadataData.bytes,
                version: 'v2', // Assume v2 by default
                error: metadataData.error || null,
              },
              {
                conflictPaths: ['proposalId'],
                skipUpdateIfNoValuesChanged: true,
              },
            );
          }
        } catch (metadataError) {
          this.logger.warn(
            `Failed to sync metadata for proposal ${proposal.id}: ${metadataError.message}`,
          );
        }

        // Sync votes
        try {
          // 1. Fetch Phase
          const newVotesMap = new Map<string, any>(); // txHash:certIndex -> voteData
          let fetchFailed = false;
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            try {
              const votesData = await this.blockfrostService.getProposalVotes(
                proposal.txHash,
                proposal.certIndex,
                page,
                100,
                'asc',
              );

              if (!votesData || votesData.length === 0) {
                hasMore = false;
                break;
              }

              for (const v of votesData) {
                // key: txHash + certIndex (unique for a vote on a specific proposal)
                const uniqueKey = `${v.tx_hash}:${v.cert_index}`;
                newVotesMap.set(uniqueKey, v);
              }

              // wait 100ms between pages
              await new Promise((resolve) => setTimeout(resolve, 100));

              if (votesData.length < 100) {
                hasMore = false;
              } else {
                page++;
              }
            } catch (pageError) {
              this.logger.warn(
                  `Failed to fetch votes page ${page} for proposal ${proposal.id}: ${pageError.message}`
              );
              fetchFailed = true;
              hasMore = false;
            }
          }

          if (fetchFailed) {
            this.logger.warn(`Skipping vote update for proposal ${proposal.id} due to fetch errors.`);
            continue; 
          }

          // We assume votes are immutable.          
          if (newVotesMap.size > 0) {
             const votesToUpsert = Array.from(newVotesMap.values()).map(vData => ({
                proposalId: proposal.id,
                txHash: vData.tx_hash,
                certIndex: vData.cert_index,
                voterRole: vData.voter_role,
                voter: vData.voter,
                vote: vData.vote,
             }));

             await this.dataSource.transaction(async (manager) => {
                const txRepo = manager.getRepository(ProposalVote);
                
                // Process in chunks
                const chunkSize = 1000;
                for(let i=0; i<votesToUpsert.length; i+=chunkSize) {
                   await txRepo.upsert(votesToUpsert.slice(i, i+chunkSize), {
                      conflictPaths: ['proposalId', 'voter'],
                      skipUpdateIfNoValuesChanged: true 
                   });
                }
             });
             this.logger.log(`Synced votes for proposal ${proposal.id}: ${votesToUpsert.length} votes upserted.`);
          }

        } catch (votesError) {
          this.logger.warn(
            `Failed to sync votes for proposal ${proposal.id}: ${votesError.message}`,
          );
        }

        // Rate limiting between proposals
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (proposalError) {
        this.logger.warn(
          `Failed to sync metadata/votes for proposal ${proposal.id}: ${proposalError.message}`,
        );
      }
    }

    return totalVotesSynced;
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
