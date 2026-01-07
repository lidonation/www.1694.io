#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { QueueService } from '../src/queue/queue.service';
import { Queues, JobTypes } from '../src/queue/queue.types';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

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
    
  } catch (error) {
    console.error('❌ Error triggering jobs:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
