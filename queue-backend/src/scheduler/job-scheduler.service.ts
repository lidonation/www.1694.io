
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
    @InjectQueue(Queues.TIMELINE_WATCHER)
    private timelineWatcherQueue: Queue,
    @InjectQueue(Queues.YACI_TIMELINE_SYNC)
    private yaciTimelineSyncQueue: Queue,
    @InjectQueue(Queues.YACI_EPOCH_STAKE)
    private yaciEpochStakeQueue: Queue,
    @InjectQueue(Queues.YACI_DELEGATOR_EPOCH_STAKE)
    private yaciDelegatorEpochStakeQueue: Queue,
    @InjectQueue(Queues.YACI_DREP_SYNC)
    private yaciDrepSyncQueue: Queue,
    @InjectQueue(Queues.YACI_PROPOSAL_SYNC)
    private yaciProposalSyncQueue: Queue,
    @InjectQueue(Queues.YACI_VOTE_SYNC)
    private yaciVoteSyncQueue: Queue,
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

      // Timeline Watcher - Every minute
      await this.timelineWatcherQueue.add(
        JobTypes.TIMELINE_WATCHER,
        {},
        {
          repeat: { pattern: '*/1 * * * *' },
          jobId: 'timeline-watcher-recurring'
        }
      );
      this.logger.log('Scheduled recurring timeline watcher job (Every minute)');

      // Yaci Timeline Sync - Every 5 minutes
      await this.yaciTimelineSyncQueue.add(
        JobTypes.YACI_TIMELINE_SYNC,
        {},
        { repeat: { pattern: '*/5 * * * *' }, jobId: 'yaci-timeline-sync-recurring' },
      );
      this.logger.log('Scheduled Yaci timeline sync (every 5 min)');

      // Yaci Epoch Stake - Every 6 hours
      await this.yaciEpochStakeQueue.add(
        JobTypes.YACI_EPOCH_STAKE,
        {},
        { repeat: { pattern: '0 */6 * * *' }, jobId: 'yaci-epoch-stake-recurring' },
      );
      this.logger.log('Scheduled Yaci epoch stake aggregation (every 6h)');

      // Yaci Delegator Epoch Stake - Every 6 hours (offset by 15 min)
      await this.yaciDelegatorEpochStakeQueue.add(
        JobTypes.YACI_DELEGATOR_EPOCH_STAKE,
        {},
        { repeat: { pattern: '15 */6 * * *' }, jobId: 'yaci-delegator-epoch-stake-recurring' },
      );
      this.logger.log('Scheduled Yaci delegator epoch stake (every 6h +15m)');

      // Yaci DRep Sync - Daily at 1am
      await this.yaciDrepSyncQueue.add(
        JobTypes.YACI_DREP_SYNC,
        {},
        { repeat: { pattern: '0 1 * * *' }, jobId: 'yaci-drep-sync-recurring' },
      );
      this.logger.log('Scheduled Yaci DRep sync (daily 1am)');

      // Yaci Proposal Sync - Every 6 hours (offset by 30 min)
      await this.yaciProposalSyncQueue.add(
        JobTypes.YACI_PROPOSAL_SYNC,
        {},
        { repeat: { pattern: '30 */6 * * *' }, jobId: 'yaci-proposal-sync-recurring' },
      );
      this.logger.log('Scheduled Yaci proposal sync (every 6h +30m)');

      // Yaci Vote Sync - Hourly
      await this.yaciVoteSyncQueue.add(
        JobTypes.YACI_VOTE_SYNC,
        {},
        { repeat: { pattern: '0 * * * *' }, jobId: 'yaci-vote-sync-recurring' },
      );
      this.logger.log('Scheduled Yaci vote sync (hourly)');

    } catch (error) {
      this.logger.error(`Failed to schedule recurring jobs: ${error.message}`);
    }
  }
}
