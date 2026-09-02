import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { QueueJob, Queues } from './queue.types';
import { Job, Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(Queues.DREP_CLAIM)
    private drepClaimQueue: Queue,
  ) {}

  /**
   * Adds a job to the specified queue.
   * @param queue The queue to which the job should be added.
   * @param data The data to be processed by the job.
   * @param options Optional job options including repeat patterns
   */
  async addToQueue<T>(
    queue: Queues,
    jobPayload: QueueJob<T>,
    options?: { repeat?: { pattern: string } },
  ) {
    if (queue === Queues.DREP_CLAIM) {
      return await this.drepClaimQueue.add(
        jobPayload.name,
        jobPayload.data,
        options,
      );
    }
    throw new Error(`Queue ${queue} is not supported by backend`);
  }
}
