import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JobTypes, Queues, StakeSyncJobData } from './queue.types';

@Injectable()
export class StakeSyncService implements OnModuleInit {
  private readonly logger = new Logger(StakeSyncService.name);

  constructor(private readonly queueService: QueueService) {}

  async onModuleInit() {
    await this.scheduleRecurringStakeSync();
  }

  async scheduleRecurringStakeSync() {
    try {
      await this.queueService.addToQueue<StakeSyncJobData>(Queues.STAKE_SYNC, {
        name: JobTypes.STAKE_SYNC,
        data: {}
      });

      this.logger.log('Scheduled recurring stake sync job to run every hour');
    } catch (error) {
      this.logger.error(`Failed to schedule stake sync job: ${error.message}`);
    }
  }

  async triggerManualStakeSync() {
    try {
      await this.queueService.addToQueue<StakeSyncJobData>(Queues.STAKE_SYNC, {
        name: `${JobTypes.STAKE_SYNC}-manual`,
        data: {}
      });

      this.logger.log('Triggered manual stake sync job');
      return { success: true, message: 'Manual stake sync triggered' };
    } catch (error) {
      this.logger.error(`Failed to trigger manual stake sync: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}