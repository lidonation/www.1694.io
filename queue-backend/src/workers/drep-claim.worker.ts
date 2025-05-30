import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Queues } from '../queue.types';

@Processor(Queues.DREP_CLAIM, {concurrency: 1})
export class DrepClaimWorker extends WorkerHost {
  async process(job: Job, token?: string): Promise<any> {
    // Implement the logic for processing the drep claim job
    console.log(`Processing job ${job.id} with data:`, job.data);

    // Simulate some processing logic
    try {
      return { success: true, message: `Job ${job.id} processed successfully` };
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      throw error; // This will mark the job as failed
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job, result: any): Promise<void> {
    console.log(`Job ${job.id} completed with result:`, result);
  }
}
