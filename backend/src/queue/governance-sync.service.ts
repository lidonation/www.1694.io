import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JobTypes, Queues, GovernanceSyncJobData } from './queue.types';

@Injectable()
export class GovernanceSyncService implements OnModuleInit {
  private readonly logger = new Logger(GovernanceSyncService.name);

  constructor(private readonly queueService: QueueService) {}

  async onModuleInit() {
    await this.scheduleRecurringGovernanceSync();
  }

  async scheduleRecurringGovernanceSync() {
    try {
      await this.queueService.addToQueue<GovernanceSyncJobData>(Queues.GOVERNANCE_SYNC, {
        name: JobTypes.GOVERNANCE_SYNC,
        data: {}
      });

      this.logger.log('Scheduled recurring governance sync job to run daily at midnight');
    } catch (error) {
      this.logger.error(`Failed to schedule governance sync job: ${error.message}`);
    }
  }

  async triggerManualGovernanceSync(forceRefresh = false) {
    try {
      await this.queueService.addToQueue<GovernanceSyncJobData>(Queues.GOVERNANCE_SYNC, {
        name: `${JobTypes.GOVERNANCE_SYNC}-manual`,
        data: { forceRefresh }
      });

      this.logger.log(`Triggered manual governance sync job (forceRefresh: ${forceRefresh})`);
      return { success: true, message: 'Manual governance sync triggered' };
    } catch (error) {
      this.logger.error(`Failed to trigger manual governance sync: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}