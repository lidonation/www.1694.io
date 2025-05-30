import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bullmq';
import { Queues } from './queue.types';
import {
  DEFAULT_ATTEMPTS,
  MAX_COMPLETED_JOB_AGE,
  MAX_COMPLETED_JOBS,
  MAX_FAILED_JOB_AGE,
  MAX_FAILED_JOBS,
} from './queue.constants';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrepClaimWorker } from './workers/drep-claim.worker';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
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
      name: Queues.DREP_CLAIM,
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,

      boardOptions: {
        uiConfig: {
          boardTitle: 'Queue Dashboard',
          pollingInterval: {
            showSetting: true,
            forceInterval: 1000, // 5 seconds
          },
        },
      },
    }),
    BullBoardModule.forFeature({
      name: Queues.DREP_CLAIM,
      adapter: BullMQAdapter,
    }),
  ],
  providers: [AppService, DrepClaimWorker],
})
export class AppModule {}
