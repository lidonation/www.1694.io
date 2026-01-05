import { Global, Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bullmq';
import { Queues } from './queue.types';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_ATTEMPTS, MAX_COMPLETED_JOB_AGE, MAX_COMPLETED_JOBS, MAX_FAILED_JOB_AGE, MAX_FAILED_JOBS } from './queue.constants';
import { DRepClaimQueueEvents } from './listeners/queue.events';
import { BlockfrostModule } from '../blockfrost/blockfrost.module';
import { GovernanceModule } from '../governance/governance.module';


@Global()
@Module({
  imports: [
    BlockfrostModule,
    GovernanceModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD')
        },
        defaultJobOptions: {
          removeOnComplete: {
            age: MAX_COMPLETED_JOB_AGE, 
            count: MAX_COMPLETED_JOBS, 
          },
          removeOnFail: {
            age: MAX_FAILED_JOB_AGE,
            count: MAX_FAILED_JOBS,
          },
          attempts: DEFAULT_ATTEMPTS,
        },
      }),
    }),
    BullModule.registerQueue({
      name: Queues.DREP_CLAIM
    }),
  ],
  controllers: [],
  providers: [QueueService, DRepClaimQueueEvents],
  exports: [QueueService],
})
export class QueueModule {}

