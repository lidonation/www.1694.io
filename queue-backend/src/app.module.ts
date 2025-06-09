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
import { TypeOrmModule } from '@nestjs/typeorm';

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
      name: Queues.DREP_CLAIM,
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
      boardOptions: {
        uiConfig: {
          boardTitle: 'Queue Dashboard',
          pollingInterval: {
            showSetting: false,
            forceInterval: 1000, // 1 second
          },
        },
      },
    }),
    BullBoardModule.forFeature({
      name: Queues.DREP_CLAIM,
      adapter: BullMQAdapter,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: 'default',
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'web_db'),
        port: +configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'voltaire'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', '1694'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: 'dbsync',
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST_DBSYNC', 'dbsync_db'),
        port: configService.get('DATABASE_PORT_DBSYNC', 5432),
        username: configService.get('DATABASE_USERNAME_DBSYNC', 'postgres'),
        password: configService.get('DATABASE_PASSWORD_DBSYNC'),
        database: configService.get('DATABASE_NAME_DBSYNC', 'cexplorer'),
      }),
    }),
  ],
  providers: [AppService, DrepClaimWorker],
})
export class AppModule {}
