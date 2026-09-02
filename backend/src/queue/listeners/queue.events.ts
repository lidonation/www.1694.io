import {
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { Queues } from '../queue.types';
import { Logger } from '@nestjs/common';

@QueueEventsListener(Queues.DREP_CLAIM)
export class DRepClaimQueueEvents extends QueueEventsHost {
  private logger = new Logger(DRepClaimQueueEvents.name);

  @OnQueueEvent('completed')
  async onCompleted(event: { jobId: string; returnvalue: any }): Promise<void> {
    this.logger.log(
      `Job ${event.jobId} completed with result: ${JSON.stringify(event.returnvalue)}`,
    );
  }

  @OnQueueEvent('added')
  async onAdded(event: {
    jobId: string;
    name: string;
    data: any;
  }): Promise<void> {
    this.logger.log(
      `Job ${event.jobId} added to queue ${event.name} with data: ${JSON.stringify(event.data)}`,
    );
  }

  @OnQueueEvent('failed')
  async onFailed(event: {
    jobId: string;
    failedReason: string;
  }): Promise<void> {
    this.logger.error(
      `Job ${event.jobId} failed with reason: ${event.failedReason}`,
    );
  }
}
