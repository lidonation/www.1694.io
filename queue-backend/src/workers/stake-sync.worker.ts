import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Queues, StakeSyncJobData, StakeSyncJobResponse } from '../queue.types';
import { BlockfrostService } from '../blockfrost/blockfrost.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Drep } from '../entities/governance/drep.entity';
import { DrepDelegator } from '../entities/governance/drep-delegator.entity';

@Injectable()
@Processor(Queues.STAKE_SYNC)
export class StakeSyncWorker extends WorkerHost {
  private readonly logger = new Logger(StakeSyncWorker.name);

  constructor(
    private readonly blockfrostService: BlockfrostService,
    @InjectDataSource('default')
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<StakeSyncJobData, StakeSyncJobResponse>): Promise<StakeSyncJobResponse> {
    this.logger.log(`Starting stake sync job: ${job.id}`);

    try {
      const latestEpoch = await this.blockfrostService.getLatestEpoch();
      const currentEpochNo = latestEpoch.epoch;

      const drepsRepository = this.dataSource.getRepository(Drep);
      const delegatorsRepository = this.dataSource.getRepository(DrepDelegator);
      const allDReps = await drepsRepository.find();

      let updatedCount = 0;
      let updatedDelegatorsCount = 0;

      for (const drep of allDReps) {
        try {
          const drepInfo = await this.blockfrostService.getDRepInfo(drep.drepId);
          
          if (drepInfo && drepInfo.amount) {
            const liveStakeLovelace = parseInt(drepInfo.amount);
            const votingPowerAda = (liveStakeLovelace / 1_000_000).toString();

            await drepsRepository.update(
              { drepId: drep.drepId },
              { 
                votingPowerAda,
                active: drepInfo.active || false,
                retired: drepInfo.retired || false,
                expired: drepInfo.expired || false,
                lastActiveEpoch: drepInfo.last_active_epoch,
                snapshotEpochNo: currentEpochNo,
                updatedAt: new Date()
              }
            );
            updatedCount++;
          }
        } catch (drepError) {
          this.logger.warn(`Failed to update stake for DRep ${drep.drepId}: ${drepError.message}`);
        }
      }

      // Also sync delegator voting power for existing delegators
      this.logger.log('Syncing delegator voting power...');
      updatedDelegatorsCount = await this.syncDelegatorVotingPower(delegatorsRepository);

      this.logger.log(`Stake sync completed: updated ${updatedCount}/${allDReps.length} DReps, ${updatedDelegatorsCount} delegators`);

      return {
        success: true,
        message: `Successfully updated stake data for ${updatedCount} DReps and ${updatedDelegatorsCount} delegators`,
        updatedDRepsCount: updatedCount,
        updatedDelegatorsCount: updatedDelegatorsCount,
        epochNo: currentEpochNo
      };

    } catch (error) {
      this.logger.error(`Stake sync job failed: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: `Stake sync failed: ${error.message}`
      };
    }
  }

  private async syncDelegatorVotingPower(delegatorsRepository): Promise<number> {
    // Get all delegators that need voting power updated (where voting_power_lovelace is null or outdated)
    const delegatorsToUpdate = await delegatorsRepository
      .createQueryBuilder('delegator')
      .where('delegator.voting_power_lovelace IS NULL')
      .orWhere('delegator.updated_at < NOW() - INTERVAL \'1 day\'')
      .limit(100) // Limit to avoid too many API calls in one run
      .getMany();

    let updatedCount = 0;

    for (const delegator of delegatorsToUpdate) {
      try {
        const stakeInfo = await this.blockfrostService.getStakeAddressInfo(delegator.stakeAddress);
        
        if (stakeInfo && stakeInfo.controlled_amount) {
          await delegatorsRepository.update(
            { drepId: delegator.drepId, stakeAddress: delegator.stakeAddress },
            { 
              votingPowerLovelace: stakeInfo.controlled_amount,
              updatedAt: new Date()
            }
          );
          updatedCount++;
        }

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        this.logger.warn(`Failed to update voting power for delegator ${delegator.stakeAddress}: ${error.message}`);
      }
    }

    return updatedCount;
  }
}
