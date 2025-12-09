import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JobTypes, Queues, DrepVotesSyncJobData } from './queue.types';

@Injectable()
export class DrepVotesSyncService implements OnModuleInit {
  private readonly logger = new Logger(DrepVotesSyncService.name);

  constructor(private readonly queueService: QueueService) {}

  async onModuleInit() {
    await this.scheduleRecurringDrepVotesSync();
  }

  async scheduleRecurringDrepVotesSync() {
    try {
      await this.queueService.addToQueue<DrepVotesSyncJobData>(Queues.DREP_VOTES_SYNC, {
        name: JobTypes.DREP_VOTES_SYNC,
        data: {}
      });

      this.logger.log('Scheduled recurring DRep votes sync job to run weekly');
    } catch (error) {
      this.logger.error(`Failed to schedule DRep votes sync job: ${error.message}`);
    }
  }

  async triggerManualDrepVotesSync(forceRefresh = false) {
    try {
      await this.queueService.addToQueue<DrepVotesSyncJobData>(Queues.DREP_VOTES_SYNC, {
        name: `${JobTypes.DREP_VOTES_SYNC}-manual`,
        data: { forceRefresh }
      });

      this.logger.log(`Triggered manual DRep votes sync job (forceRefresh: ${forceRefresh})`);
      return { success: true, message: 'Manual DRep votes sync triggered' };
    } catch (error) {
      this.logger.error(`Failed to trigger manual DRep votes sync: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}