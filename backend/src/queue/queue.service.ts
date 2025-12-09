import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { QueueJob, Queues } from './queue.types';
import { Job, Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(Queues.DREP_CLAIM)
    private drepClaimQueue: Queue,
    @InjectQueue(Queues.STAKE_SYNC)
    private stakeSyncQueue: Queue,
    @InjectQueue(Queues.GOVERNANCE_SYNC)
    private governanceSyncQueue: Queue,
    @InjectQueue(Queues.DREP_VOTES_SYNC)
    private drepVotesSyncQueue: Queue,
    @InjectQueue(Queues.PROPOSALS_SYNC)
    private proposalsSyncQueue: Queue,
  ) {}

  /**
   * Adds a job to the specified queue.
   * @param queue The queue to which the job should be added.
   * @param data The data to be processed by the job.
   * @param options Optional job options including repeat patterns
   */
  async addToQueue<T>(queue: Queues, jobPayload: QueueJob<T>, options?: { repeat?: { pattern: string } }) {
    let job: Job<T, any> | null = null;
    switch (queue) {
      case Queues.DREP_CLAIM:
        job = await this.drepClaimQueue.add(jobPayload.name, jobPayload.data, options);
        break;
      case Queues.STAKE_SYNC:
        job = await this.stakeSyncQueue.add(jobPayload.name, jobPayload.data, {
          repeat: { pattern: '0 * * * *' }, // Hourly
          ...options
        });
        break;
      case Queues.GOVERNANCE_SYNC:
        // For manual triggers, don't use repeat pattern
        const jobOptions = jobPayload.name.includes('-manual') ? options : {
          repeat: { pattern: '0 0 * * *' }, // Daily at midnight
          ...options
        };
        job = await this.governanceSyncQueue.add(jobPayload.name, jobPayload.data, jobOptions);
        break;
      case Queues.DREP_VOTES_SYNC:
        job = await this.drepVotesSyncQueue.add(jobPayload.name, jobPayload.data, options);
        break;
      case Queues.PROPOSALS_SYNC:
        job = await this.proposalsSyncQueue.add(jobPayload.name, jobPayload.data, options);
        break;
      default:
        throw new Error(`Queue ${queue} is not supported`);
    }
    return job;
  }
}
