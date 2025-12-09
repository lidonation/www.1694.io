import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobTypes, Queues, DrepVotesSyncJobData, DrepVotesSyncJobResponse } from '../queue.types';
import { BlockfrostService } from '../../blockfrost/blockfrost.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Drep } from '../../entities/governance/drep.entity';
import { ProposalVote } from '../../entities/governance/proposal-vote.entity';

@Injectable()
@Processor(Queues.DREP_VOTES_SYNC)
export class DrepVotesSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(DrepVotesSyncProcessor.name);

  constructor(
    private readonly blockfrostService: BlockfrostService,
    @InjectDataSource('default')
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<DrepVotesSyncJobData, DrepVotesSyncJobResponse>): Promise<DrepVotesSyncJobResponse> {
    this.logger.log(`Starting DRep votes sync job: ${job.id}`);

    try {
      const { forceRefresh = false } = job.data;
      
      let totalVotesCount = 0;
      let processedDrepsCount = 0;

      // Get all DReps from our database
      const drepsRepository = this.dataSource.getRepository(Drep);
      const votesRepository = this.dataSource.getRepository(ProposalVote);
      
      const allDReps = await drepsRepository.find();
      this.logger.log(`Found ${allDReps.length} DReps to process votes for`);

      for (const drep of allDReps) {
        try {
          if (forceRefresh) {
            // Clear existing votes for this DRep if force refresh
            await votesRepository.delete({ voter: drep.drepId });
          }

          let page = 1;
          let hasMore = true;
          let drepVotesCount = 0;

          while (hasMore) {
            try {
              const votesData = await this.blockfrostService.getDRepVotes(drep.drepId, page, 100, 'asc');
              
              if (!votesData || votesData.length === 0) {
                hasMore = false;
                break;
              }

              for (const voteData of votesData) {
                try {
                  // Check if vote already exists (unless force refresh)
                  if (!forceRefresh) {
                    const existingVote = await votesRepository.findOne({
                      where: {
                        txHash: voteData.tx_hash,
                        certIndex: voteData.cert_index,
                        voter: drep.drepId,
                      }
                    });
                    
                    if (existingVote) {
                      continue; // Skip if already exists
                    }
                  }

                  await votesRepository.upsert({
                    proposalId: voteData.proposal_id || `${voteData.tx_hash}_${voteData.cert_index}`,
                    txHash: voteData.tx_hash,
                    certIndex: voteData.cert_index,
                    voterRole: 'drep',
                    voter: drep.drepId,
                    vote: voteData.vote,
                  }, {
                    conflictPaths: ['proposalId', 'voter'],
                    skipUpdateIfNoValuesChanged: true,
                  });

                  drepVotesCount++;
                  totalVotesCount++;
                } catch (voteError) {
                  this.logger.warn(`Failed to upsert vote for DRep ${drep.drepId}: ${voteError.message}`);
                }
              }

              // Rate limiting - wait 100ms between pages
              await new Promise(resolve => setTimeout(resolve, 100));
              
              if (votesData.length < 100) {
                hasMore = false;
              } else {
                page++;
              }

            } catch (pageError) {
              this.logger.warn(`Failed to fetch votes page ${page} for DRep ${drep.drepId}: ${pageError.message}`);
              hasMore = false;
            }
          }

          if (drepVotesCount > 0) {
            // Update the DRep's governance vote count
            await drepsRepository.update(
              { drepId: drep.drepId },
              { governanceVoteCount: drepVotesCount }
            );
          }

          processedDrepsCount++;
          
          if (processedDrepsCount % 10 === 0) {
            this.logger.log(`Processed ${processedDrepsCount}/${allDReps.length} DReps, ${totalVotesCount} total votes`);
          }

          // Rate limiting between DReps
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (drepError) {
          this.logger.warn(`Failed to sync votes for DRep ${drep.drepId}: ${drepError.message}`);
        }
      }

      this.logger.log(
        `DRep votes sync completed: processed ${processedDrepsCount} DReps, synced ${totalVotesCount} votes`
      );

      return {
        success: true,
        message: `Successfully synced DRep votes`,
        drepVotesCount: totalVotesCount,
        processedDreps: processedDrepsCount,
      };

    } catch (error) {
      this.logger.error(`DRep votes sync job failed: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: `DRep votes sync failed: ${error.message}`,
      };
    }
  }
}