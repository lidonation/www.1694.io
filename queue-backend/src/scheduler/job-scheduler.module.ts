
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobSchedulerService } from './job-scheduler.service';
import { Queues } from '../queue.types';

@Module({
  imports: [
    BullModule.registerQueue({
      name: Queues.STAKE_SYNC,
    }),
    BullModule.registerQueue({
      name: Queues.GOVERNANCE_SYNC,
    }),
    BullModule.registerQueue({
      name: Queues.PROPOSALS_SYNC,
    }),
    BullModule.registerQueue({
      name: Queues.DREP_VOTES_SYNC,
    }),
  ],
  providers: [JobSchedulerService],
})
export class JobSchedulerModule {}
