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
    this.logger.log(`Starting proposals sync job: ${job.id}`);

    try {
      const { forceRefresh = false } = job.data;
      
      let proposalsCount = 0;

      // Sync Proposals
      this.logger.log('Syncing proposals...');
      proposalsCount = await this.syncProposals();

      // Sync Proposal Metadata
      this.logger.log('Syncing proposal metadata...');
      const metadataCount = await this.syncProposalMetadata();

      this.logger.log(
        `Proposals sync completed: ${proposalsCount} proposals, ${metadataCount} metadata entries`
      );

      return {
        success: true,
        message: `Successfully synced ${proposalsCount} proposals and ${metadataCount} metadata entries`,
        proposalsCount,
        metadataCount,
      };

    } catch (error) {
      this.logger.error(`Proposals sync job failed: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: `Proposals sync failed: ${error.message}`,
      };
    }
  }

  private async syncProposals(): Promise<number> {
    const proposalsRepository = this.dataSource.getRepository(Proposal);
    let page = 1;
    let totalSynced = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        this.logger.log(`Fetching proposals page ${page}...`);
        const proposalsListData = await this.blockfrostService.getAllProposals(page, 100, 'asc');
        
        if (!proposalsListData || proposalsListData.length === 0) {
          this.logger.log(`No more proposals found on page ${page}`);
          hasMore = false;
          break;
        }

        this.logger.log(`Processing ${proposalsListData.length} proposals from page ${page}...`);

        for (const proposalListItem of proposalsListData) {
          try {
            // Get full proposal details using individual endpoint
            this.logger.debug(`Fetching details for proposal ${proposalListItem.tx_hash}/${proposalListItem.cert_index}`);
            const proposalData = await this.blockfrostService.getProposal(proposalListItem.tx_hash, proposalListItem.cert_index);
            
            if (proposalData) {
              // Fetch transaction to get block time
              let blockTime: Date | null = null;
              try {
                const txData = await this.blockfrostService.getTransaction(proposalData.tx_hash);
                if (txData && txData.block_time) {
                  blockTime = new Date(txData.block_time * 1000);
                }
              } catch (txError) {
                this.logger.warn(`Failed to fetch tx time for proposal ${proposalData.tx_hash}: ${txError.message}`);
              }

              await proposalsRepository.upsert({
                id: proposalData.id,
                txHash: proposalData.tx_hash,
                certIndex: proposalData.cert_index,
                governanceType: proposalData.governance_type,
                governanceDescription: proposalData.governance_description || null,
                depositLovelace: proposalData.deposit || null,
                returnStakeAddress: proposalData.return_address || null,
                ratifiedEpoch: proposalData.ratified_epoch || null,
                enactedEpoch: proposalData.enacted_epoch || null,
                droppedEpoch: proposalData.dropped_epoch || null,
                expiredEpoch: proposalData.expired_epoch || null,
                expirationEpoch: proposalData.expiration || null,
                blockTime: blockTime,
              }, {
                conflictPaths: ['id'],
                skipUpdateIfNoValuesChanged: true,
              });
              totalSynced++;
              
              if (totalSynced % 10 === 0) {
                this.logger.log(`Synced ${totalSynced} proposals so far...`);
              }
            }
            
            // Rate limiting between individual proposal requests
            await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay for extra calls
          } catch (proposalError) {
            this.logger.warn(`Failed to upsert proposal ${proposalListItem.tx_hash}/${proposalListItem.cert_index}: ${proposalError.message}`);
          }
        }

        // Rate limiting - wait 100ms between pages
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (proposalsListData.length < 100) {
          hasMore = false;
        } else {
          page++;
        }

      } catch (pageError) {
        this.logger.error(`Failed to fetch proposals page ${page}: ${pageError.message}`);
        hasMore = false;
      }
    }

    return totalSynced;
  }

  private async syncProposalMetadata(): Promise<number> {
    const proposalsRepository = this.dataSource.getRepository(Proposal);
    const metadataRepository = this.dataSource.getRepository(ProposalMetadata);
    
    const allProposals = await proposalsRepository.find();
    let totalMetadataSynced = 0;

    this.logger.log(`Syncing metadata for ${allProposals.length} proposals...`);

    for (const proposal of allProposals) {
      try {
        const metadataData = await this.blockfrostService.getProposalMetadata(proposal.txHash, proposal.certIndex);
        
        if (metadataData) {
          await metadataRepository.upsert({
            proposalId: proposal.id,
            url: metadataData.url,
            hash: metadataData.hash,
            jsonMetadata: metadataData.json_metadata,
            bytes: metadataData.bytes,
            version: 'v2', // Assume v2 by default
            error: metadataData.error || null,
          }, {
            conflictPaths: ['proposalId'],
            skipUpdateIfNoValuesChanged: true,
          });
          totalMetadataSynced++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (metadataError) {
        this.logger.warn(`Failed to sync metadata for proposal ${proposal.id}: ${metadataError.message}`);
      }
    }

    return totalMetadataSynced;
  }
}
