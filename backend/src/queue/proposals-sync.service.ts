import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobTypes, Queues, ProposalsSyncJobData } from './queue.types';

@Injectable()
export class ProposalsSyncService {
  private readonly logger = new Logger(ProposalsSyncService.name);

  constructor(
    @InjectQueue(Queues.PROPOSALS_SYNC) 
    private readonly proposalsSyncQueue: Queue<ProposalsSyncJobData>
  ) {}

  async triggerManualSync(forceRefresh: boolean = false): Promise<{ success: boolean; message: string; jobId: string }> {
    try {
      this.logger.log('Triggering manual proposals sync...');
      
      const job = await this.proposalsSyncQueue.add(
        JobTypes.PROPOSALS_SYNC,
        { forceRefresh },
        {
          removeOnComplete: 10,
          removeOnFail: 10,
        }
      );

      return {
        success: true,
        message: 'Manual proposals sync triggered',
        jobId: job.id?.toString() || 'unknown',
      };
    } catch (error) {
      this.logger.error('Failed to trigger manual proposals sync', error.stack);
      return {
        success: false,
        message: `Failed to trigger proposals sync: ${error.message}`,
        jobId: '',
      };
    }
  }

  async scheduleRecurringSync(): Promise<void> {
    try {
      // Schedule to run every 6 hours
      await this.proposalsSyncQueue.add(
        JobTypes.PROPOSALS_SYNC,
        { forceRefresh: false },
        {
          repeat: { pattern: '0 */6 * * *' }, // Every 6 hours
          removeOnComplete: 5,
          removeOnFail: 5,
        }
      );

      this.logger.log('Scheduled recurring proposals sync job to run every 6 hours');
    } catch (error) {
      this.logger.error('Failed to schedule recurring proposals sync', error.stack);
    }
  }
}