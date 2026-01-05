import { Module } from "@nestjs/common";
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
import { Drep } from "./entities/governance/drep.entity";
import { DrepDelegator } from "./entities/governance/drep-delegator.entity";
import { Proposal } from "./entities/governance/proposal.entity";
import { ProposalMetadata } from "./entities/governance/proposal-metadata.entity";
import { ProposalVote } from "./entities/governance/proposal-vote.entity";
import { DrepTimelineEvent } from "./entities/governance/drep-timeline-event.entity";
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { BlockfrostModule } from "./blockfrost/blockfrost.module";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BlockfrostModule,
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
      }),
    }),
  ],
  providers: [
    AppService,
    DrepClaimWorker,
    StakeSyncWorker,
    GovernanceSyncWorker,
    DrepVotesSyncWorker,
    ProposalsSyncWorker
  ],
})
export class AppModule {}
