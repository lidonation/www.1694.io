import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AppService } from "./app.service";
import { BullModule } from "@nestjs/bullmq";
import { Queues } from "./queue.types";
import {
  DEFAULT_ATTEMPTS,
  MAX_COMPLETED_JOB_AGE,
  MAX_COMPLETED_JOBS,
  MAX_FAILED_JOB_AGE,
  MAX_FAILED_JOBS,
} from "./queue.constants";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DrepClaimWorker } from "./workers/drep-claim.worker";
import { StakeSyncWorker } from "./workers/stake-sync.worker";
import { GovernanceSyncWorker } from "./workers/governance-sync.worker";
import { DrepVotesSyncWorker } from "./workers/drep-votes-sync.worker";
import { ProposalsSyncWorker } from "./workers/proposals-sync.worker";
import { TimelineWatcherWorker } from "./workers/timeline-watcher.worker";
import { YaciTimelineSyncWorker } from "./workers/yaci-timeline-sync.worker";
import { YaciEpochStakeWorker } from "./workers/yaci-epoch-stake.worker";
import { YaciDelegatorEpochStakeWorker } from "./workers/yaci-delegator-epoch-stake.worker";
import { YaciDRepSyncWorker } from "./workers/yaci-drep-sync.worker";
import { YaciProposalSyncWorker } from "./workers/yaci-proposal-sync.worker";
import { YaciVoteSyncWorker } from "./workers/yaci-vote-sync.worker";
import { JobSchedulerModule } from "./scheduler/job-scheduler.module";
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { BlockfrostModule } from "./blockfrost/blockfrost.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GovernanceModule } from "./governance/governance.module";
import { SyncTriggerController } from "./sync-trigger.controller";
import { YaciStoreModule } from "./yaci/yaci-store.module";


@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.production'],
    }),
    JobSchedulerModule,
    BlockfrostModule,
    GovernanceModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>("REDIS_HOST") || "localhost",
          port: configService.get<number>("REDIS_PORT") || 6379,
          password: configService.get<string>("REDIS_PASSWORD"),
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
    BullModule.registerQueue({
      name: Queues.STAKE_SYNC,
    }),
    BullModule.registerQueue({
      name: Queues.GOVERNANCE_SYNC,
    }),
    BullModule.registerQueue({
      name: Queues.DREP_VOTES_SYNC,
    }),
    BullModule.registerQueue({
      name: Queues.PROPOSALS_SYNC,
    }),
    BullModule.registerQueue({
      name: Queues.TIMELINE_WATCHER,
    }),
    BullModule.registerQueue({ name: Queues.YACI_TIMELINE_SYNC }),
    BullModule.registerQueue({ name: Queues.YACI_EPOCH_STAKE }),
    BullModule.registerQueue({ name: Queues.YACI_DELEGATOR_EPOCH_STAKE }),
    BullModule.registerQueue({ name: Queues.YACI_DREP_SYNC }),
    BullModule.registerQueue({ name: Queues.YACI_PROPOSAL_SYNC }),
    BullModule.registerQueue({ name: Queues.YACI_VOTE_SYNC }),
    BullBoardModule.forRoot({
      route: "/queues",
      adapter: ExpressAdapter,
      boardOptions: {
        uiConfig: {
          boardTitle: "Queue Dashboard",
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
    BullBoardModule.forFeature({
      name: Queues.STAKE_SYNC,
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: Queues.GOVERNANCE_SYNC,
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: Queues.DREP_VOTES_SYNC,
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: Queues.PROPOSALS_SYNC,
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: Queues.TIMELINE_WATCHER,
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({ name: Queues.YACI_TIMELINE_SYNC,        adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: Queues.YACI_EPOCH_STAKE,          adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: Queues.YACI_DELEGATOR_EPOCH_STAKE, adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: Queues.YACI_DREP_SYNC,            adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: Queues.YACI_PROPOSAL_SYNC,        adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: Queues.YACI_VOTE_SYNC,            adapter: BullMQAdapter }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: "default",
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("DATABASE_HOST", "web_db"),
        port: +configService.get("DATABASE_PORT", 5432),
        username: configService.get("DATABASE_USERNAME", "voltaire"),
        password: configService.get("DATABASE_PASSWORD", "postgres"),
        database: configService.get("DATABASE_NAME", "1694"),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: 'yaci_store',
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host:     configService.get('YACI_STORE_DB_HOST',     'localhost'),
        port:     +configService.get('YACI_STORE_DB_PORT',    5432),
        username: configService.get('YACI_STORE_DB_USERNAME', 'yaci'),
        password: configService.get('YACI_STORE_DB_PASSWORD', 'yaci'),
        database: configService.get('YACI_STORE_DB_NAME',     'yaci_store'),
        synchronize: false,
      }),
    }),
    YaciStoreModule,
  ],
  controllers: [SyncTriggerController],
  providers: [
    AppService,
    DrepClaimWorker,
    StakeSyncWorker,
    GovernanceSyncWorker,
    DrepVotesSyncWorker,
    ProposalsSyncWorker,
    TimelineWatcherWorker,
    YaciTimelineSyncWorker,
    YaciEpochStakeWorker,
    YaciDelegatorEpochStakeWorker,
    YaciDRepSyncWorker,
    YaciProposalSyncWorker,
    YaciVoteSyncWorker,
  ],
})
export class AppModule {}

