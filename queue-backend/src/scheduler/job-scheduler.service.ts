import { Logger } from "@nestjs/common";

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Queues, JobTypes } from '../queue.types';

@Injectable()
export class JobSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobSchedulerService.name);

  constructor(
    @InjectQueue(Queues.STAKE_SYNC)
    private stakeSyncQueue: Queue,
    @InjectQueue(Queues.GOVERNANCE_SYNC)
    private governanceSyncQueue: Queue,
    @InjectQueue(Queues.PROPOSALS_SYNC)
    private proposalsSyncQueue: Queue,
    @InjectQueue(Queues.DREP_VOTES_SYNC)
    private drepVotesSyncQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.scheduleRecurringJobs();
  }

  async scheduleRecurringJobs() {
    try {
      // Stake Sync - Hourly
      await this.stakeSyncQueue.add(
        JobTypes.STAKE_SYNC,
        {},
        {
          repeat: { pattern: '0 * * * *' },
          jobId: 'stake-sync-recurring' // Static ID to prevent duplicates
        }
      );
      this.logger.log('Scheduled recurring stake sync job (Hourly)');

      // Governance Sync - Daily at midnight
      await this.governanceSyncQueue.add(
        JobTypes.GOVERNANCE_SYNC,
        {},
        {
          repeat: { pattern: '0 0 * * *' },
          jobId: 'governance-sync-recurring' // Static ID to prevent duplicates
        }
      );
      this.logger.log('Scheduled recurring governance sync job (Daily at midnight)');

      // Proposals Sync - Every 6 hours
      await this.proposalsSyncQueue.add(
        JobTypes.PROPOSALS_SYNC,
        { forceRefresh: false },
        {
          repeat: { pattern: '0 */6 * * *' },
          jobId: 'proposals-sync-recurring',
          removeOnComplete: 5,
          removeOnFail: 5,
        }
      );
      this.logger.log('Scheduled recurring proposals sync job (Every 6 hours)');

      // DRep Votes Sync - Weekly (Sunday at midnight)
      await this.drepVotesSyncQueue.add(
        JobTypes.DREP_VOTES_SYNC,
        { forceRefresh: false },
        {
          repeat: { pattern: '0 0 * * 0' },
          jobId: 'drep-votes-sync-recurring',
        }
      );
      this.logger.log('Scheduled recurring DRep votes sync job (Weekly)');

    } catch (error) {
      this.logger.error(`Failed to schedule recurring jobs: ${error.message}`);
    }
  }
}
