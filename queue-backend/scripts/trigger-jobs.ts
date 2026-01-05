#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { Module, Injectable } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Queues, JobTypes } from '../src/queue.types';

// Define QueueJob interface locally
interface QueueJob<T> {
  name: string;
  data: T;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(Queues.DREP_CLAIM)
    private drepClaimQueue: Queue,
    @InjectQueue(Queues.STAKE_SYNC)
    private stakeSyncQueue: Queue,
    @InjectQueue(Queues.GOVERNANCE_SYNC)
    private governanceSyncQueue: Queue,
    @InjectQueue(Queues.DREP_VOTES_SYNC)
    private drepVotesSyncQueue: Queue,
    @InjectQueue(Queues.PROPOSALS_SYNC)
    private proposalsSyncQueue: Queue,
  ) {}

  async addToQueue<T>(queue: Queues, jobPayload: QueueJob<T>, options?: { repeat?: { pattern: string } }) {
    let job;
    switch (queue) {
      case Queues.DREP_CLAIM:
        job = await this.drepClaimQueue.add(jobPayload.name, jobPayload.data, options);
        break;
      case Queues.STAKE_SYNC:
        job = await this.stakeSyncQueue.add(jobPayload.name, jobPayload.data, {
          // repeat: { pattern: '0 * * * *' }, // Hourly default removed for manual trigger script
          ...options
        });
        break;
      case Queues.GOVERNANCE_SYNC:
        const jobOptions = jobPayload.name.includes('-manual') ? options : {
           // repeat: { pattern: '0 0 * * *' }, // Daily default removed for manual trigger script
          ...options
        };
        job = await this.governanceSyncQueue.add(jobPayload.name, jobPayload.data, jobOptions);
        break;
      case Queues.DREP_VOTES_SYNC:
        job = await this.drepVotesSyncQueue.add(jobPayload.name, jobPayload.data, options);
        break;
      case Queues.PROPOSALS_SYNC:
        job = await this.proposalsSyncQueue.add(jobPayload.name, jobPayload.data, options);
        break;
      default:
        throw new Error(`Queue ${queue} is not supported`);
    }
    return job;
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.production'],
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379') || 6379,
          password: process.env.REDIS_PASSWORD
        },
      }),
    }),
    BullModule.registerQueue({
      name: Queues.DREP_CLAIM
    }),
    BullModule.registerQueue({
      name: Queues.GOVERNANCE_SYNC
    }),
    BullModule.registerQueue({
      name: Queues.STAKE_SYNC
    }),
    BullModule.registerQueue({
      name: Queues.DREP_VOTES_SYNC
    }),
    BullModule.registerQueue({
      name: Queues.PROPOSALS_SYNC
    }),
  ],
  providers: [QueueService],
})
class JobTriggerModule {}

async function main() {
  const [, , jobType, ...args] = process.argv;
  
  if (!jobType || !['governance-sync', 'stake-sync', 'drep-votes-sync', 'proposals-sync', 'all'].includes(jobType)) {
    console.log('Usage: npm run job:trigger <governance-sync|stake-sync|drep-votes-sync|proposals-sync|all> [options]');
    console.log('Options for governance-sync, drep-votes-sync, and proposals-sync: --force');
    process.exit(1);
  }

  console.log(`🚀 Triggering ${jobType} job...`);
  
  try {
    const app = await NestFactory.createApplicationContext(JobTriggerModule);
    const queueService = app.get(QueueService);
    
    if (jobType === 'governance-sync' || jobType === 'all') {
      const forceRefresh = args.includes('--force');
      
      console.log(`📊 Triggering governance sync (forceRefresh: ${forceRefresh})...`);
      const job = await queueService.addToQueue(Queues.GOVERNANCE_SYNC, {
        name: `${JobTypes.GOVERNANCE_SYNC}-manual`,
        data: { forceRefresh }
      });
      console.log(`✅ Governance sync job queued with ID: ${job.id}`);
    }
    
    if (jobType === 'stake-sync' || jobType === 'all') {
      console.log('💰 Triggering stake sync...');
      const job = await queueService.addToQueue(Queues.STAKE_SYNC, {
        name: `${JobTypes.STAKE_SYNC}-manual`,
        data: {}
      });
      console.log(`✅ Stake sync job queued with ID: ${job.id}`);
    }
    
    if (jobType === 'proposals-sync' || jobType === 'all') {
      const forceRefresh = args.includes('--force');
      
      console.log(`📋 Triggering proposals sync (forceRefresh: ${forceRefresh})...`);
      const job = await queueService.addToQueue(Queues.PROPOSALS_SYNC, {
        name: `${JobTypes.PROPOSALS_SYNC}-manual`,
        data: { forceRefresh }
      });
      console.log(`✅ Proposals sync job queued with ID: ${job.id}`);
    }
    
    if (jobType === 'drep-votes-sync' || jobType === 'all') {
      const forceRefresh = args.includes('--force');
      
      console.log(`🗳️ Triggering DRep votes sync (forceRefresh: ${forceRefresh})...`);
      const job = await queueService.addToQueue(Queues.DREP_VOTES_SYNC, {
        name: `${JobTypes.DREP_VOTES_SYNC}-manual`,
        data: { forceRefresh }
      });
      console.log(`✅ DRep votes sync job queued with ID: ${job.id}`);
    }
    
    await app.close();
    console.log('🎉 Jobs queued successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error triggering jobs:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
