import { Global, Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bullmq';
import { Queues } from './queue.types';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_ATTEMPTS, MAX_COMPLETED_JOB_AGE, MAX_COMPLETED_JOBS, MAX_FAILED_JOB_AGE, MAX_FAILED_JOBS } from './queue.constants';
import { DRepClaimQueueEvents } from './listeners/queue.events';
import { StakeSyncProcessor } from './processors/stake-sync.processor';
import { StakeSyncService } from './stake-sync.service';
import { StakeSyncController } from './stake-sync.controller';
import { GovernanceSyncService } from './governance-sync.service';
import { GovernanceSyncController } from './governance-sync.controller';
import { GovernanceSyncProcessor } from './processors/governance-sync.processor';
import { DrepVotesSyncProcessor } from './processors/drep-votes-sync.processor';
import { DrepVotesSyncService } from './drep-votes-sync.service';
import { ProposalsSyncProcessor } from './processors/proposals-sync.processor';
import { ProposalsSyncService } from './proposals-sync.service';
import { ProposalsSyncController } from './proposals-sync.controller';
import { DrepVotesSyncController } from './drep-votes-sync.controller';
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
    BullModule.registerQueue({
      name: Queues.STAKE_SYNC
    }),
    BullModule.registerQueue({
      name: Queues.GOVERNANCE_SYNC
    }),
    BullModule.registerQueue({
      name: Queues.DREP_VOTES_SYNC
    }),
    BullModule.registerQueue({
      name: Queues.PROPOSALS_SYNC
    })
  ],
  controllers: [StakeSyncController, GovernanceSyncController, ProposalsSyncController, DrepVotesSyncController],
  providers: [QueueService, DRepClaimQueueEvents, StakeSyncProcessor, StakeSyncService, GovernanceSyncProcessor, GovernanceSyncService, DrepVotesSyncProcessor, DrepVotesSyncService, ProposalsSyncProcessor, ProposalsSyncService],
  exports: [QueueService, StakeSyncService, GovernanceSyncService, DrepVotesSyncService, ProposalsSyncService],
})
export class QueueModule {}
