import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { QueueJob, Queues } from './queue.types';
import { Job, Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(Queues.DREP_CLAIM)
    private drepClaimQueue: Queue,
    // where we can injetc our queues
  ) {}

  /**
   * Adds a job to the specified queue.
   * @param queue The queue to which the job should be added.
   * @param data The data to be processed by the job.
   */
  async addToQueue<T>(queue: Queues, jobPayload: QueueJob<T>) {
    let job: Job<T, any> | null = null;
    switch (queue) {
      case Queues.DREP_CLAIM:
        job = await this.drepClaimQueue.add(jobPayload.name, jobPayload.data);
        break;
      default:
        throw new Error(`Queue ${queue} is not supported`);
    }
    return job;
  }
}
