import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  JobTypes,
  Queues,
  GovernanceSyncJobData,
  GovernanceSyncJobResponse,
} from '../queue.types';
import { BlockfrostService } from '../../blockfrost/blockfrost.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Drep } from '../../entities/governance/drep.entity';
import { DrepDelegator } from '../../entities/governance/drep-delegator.entity';
import { Proposal } from '../../entities/governance/proposal.entity';
import { ProposalMetadata } from '../../entities/governance/proposal-metadata.entity';
import { ProposalVote } from '../../entities/governance/proposal-vote.entity';

@Injectable()
@Processor(Queues.GOVERNANCE_SYNC)
export class GovernanceSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(GovernanceSyncProcessor.name);

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
      const { forceRefresh = false } = job.data;

      let drepsCount = 0;
      let proposalsCount = 0;
      let votesCount = 0;
      let delegatorsCount = 0;

      // Sync DReps
      this.logger.log('Syncing DReps...');
      drepsCount = await this.syncDReps();

      // Sync DRep Delegators
      this.logger.log('Syncing DRep delegators...');
      delegatorsCount = await this.syncDRepDelegators();

      // Update delegation counts on DReps
      this.logger.log('Updating delegation counts...');
      await this.updateDelegationCounts();

      // Sync Proposals
      this.logger.log('Syncing proposals...');
      proposalsCount = await this.syncProposals();

      // Sync Proposal Metadata and Votes
      this.logger.log('Syncing proposal metadata and votes...');
      votesCount = await this.syncProposalMetadataAndVotes();

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
            let detailedInfo = null;
            let metadata = null;

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
              metadataUrl: metadata?.url || null,
              metadataHash: metadata?.hash || null,
              givenName: metadata?.json_metadata?.body?.givenName || null,
              imageUrl:
                metadata?.json_metadata?.body?.image?.contentUrl || null,
              paymentAddress:
                metadata?.json_metadata?.body?.paymentAddress || null,
              objectives: metadata?.json_metadata?.body?.objectives || null,
              motivations: metadata?.json_metadata?.body?.motivations || null,
              qualifications:
                metadata?.json_metadata?.body?.qualifications || null,
              references: metadata?.json_metadata?.body?.references || null,
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
      try {
        await delegatorsRepository.delete({ drepId: drep.drepId });

        let page = 1;
        let hasMore = true;

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

            for (const delegatorData of delegatorsData) {
              try {
                let votingPowerLovelace: string | null = null;
                try {
                  const stakeInfo =
                    await this.blockfrostService.getStakeAddressInfo(
                      delegatorData.address,
                    );
                  votingPowerLovelace = stakeInfo?.controlled_amount || null;
                  await new Promise((resolve) => setTimeout(resolve, 50));
                } catch (stakeInfoError) {
                  this.logger.warn(
                    `Failed to get stake info for ${delegatorData.address}: ${stakeInfoError.message}`,
                  );
                }

                await delegatorsRepository.upsert(
                  {
                    drepId: drep.drepId,
                    stakeAddress: delegatorData.address,
                    amountLovelace: delegatorData.amount,
                    votingPowerLovelace,
                  },
                  {
                    conflictPaths: ['drepId', 'stakeAddress'],
                    skipUpdateIfNoValuesChanged: true,
                  },
                );
                totalSynced++;
              } catch (delegatorError) {
                this.logger.warn(
                  `Failed to upsert delegator ${delegatorData.address}: ${delegatorError.message}`,
                );
              }
            }

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
            hasMore = false;
          }
        }
      } catch (drepError) {
        this.logger.warn(
          `Failed to sync delegators for DRep ${drep.drepId}: ${drepError.message}`,
        );
      }
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

        // Rate limiting - wait 100ms between pages
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
          // Clear existing votes for this proposal
          await votesRepository.delete({ proposalId: proposal.id });

          let page = 1;
          let hasMore = true;

          while (hasMore) {
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

            for (const voteData of votesData) {
              try {
                await votesRepository.insert({
                  proposalId: proposal.id,
                  txHash: voteData.tx_hash,
                  certIndex: voteData.cert_index,
                  voterRole: voteData.voter_role,
                  voter: voteData.voter,
                  vote: voteData.vote,
                });
                totalVotesSynced++;
              } catch (voteError) {
                this.logger.warn(
                  `Failed to insert vote for proposal ${proposal.id}: ${voteError.message}`,
                );
              }
            }

            // Rate limiting - wait 100ms between pages
            await new Promise((resolve) => setTimeout(resolve, 100));

            if (votesData.length < 100) {
              hasMore = false;
            } else {
              page++;
            }
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
