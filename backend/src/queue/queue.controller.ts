import { Controller, Post } from '@nestjs/common';
import { QueueService } from './queue.service';
import { Queues, TestJobData } from './queue.types';

@Controller('queue')
export class QueueController {
  constructor(private queueService: QueueService) {}
  @Post('test')
  async testQueue(): Promise<string> {
    try {
      const job = await this.queueService.addToQueue<TestJobData>(
        Queues.DREP_CLAIM,
        {
          name: 'test-job',
          data: {
            test: 'This is a test job',
          },
        },
      );
      return `Job added with ID: ${job.id}`;
    } catch (error) {
      console.error('Error adding job to queue:', error);
      throw error;
    }
  }
}
