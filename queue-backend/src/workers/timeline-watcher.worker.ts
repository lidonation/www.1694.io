import { ProviderDeferred } from '../blockfrost/request-budget';
import { batchDatabase, runBatch, targets } from '../blockfrost/sync-run';
import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { Queues, JobTypes } from '../queue.types';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, MoreThan } from 'typeorm';
import { DrepTimelineEvent } from '../entities/governance/drep-timeline-event.entity';
import { DrepDelegator } from '../entities/governance/drep-delegator.entity';
import { SyncState } from '../entities/sync-state.entity';
import { BlockfrostService } from '../blockfrost/blockfrost.service';
import { SYNTHETIC_TX_INDEX_OFFSET } from '../queue.constants';

@Injectable()
@Processor(Queues.TIMELINE_WATCHER)
export class TimelineWatcherWorker extends WorkerHost {
  private readonly logger = new Logger(TimelineWatcherWorker.name);
  private readonly STATE_KEY = 'timeline_watcher_last_id';

  constructor(
    @InjectDataSource('default')
    private readonly dataSource: DataSource,
    private readonly blockfrostService: BlockfrostService,
    @InjectQueue(Queues.GOVERNANCE_SYNC)
    private readonly governanceSyncQueue: Queue,
    @InjectQueue(Queues.PROPOSALS_SYNC)
    private readonly proposalsSyncQueue: Queue,
    @InjectQueue(Queues.DREP_VOTES_SYNC)
    private readonly drepVotesSyncQueue: Queue,
  ) {
    super();
  }

  async process(_job: Job, token?: string): Promise<any> {
    return runBatch(this.dataSource, _job, token, async () => {
      const syncStateRepo = batchDatabase(this.dataSource).getRepository(
        SyncState,
      );
      const timelineRepo = batchDatabase(this.dataSource).getRepository(
        DrepTimelineEvent,
      );

      let state = await syncStateRepo.findOne({
        where: { key: this.STATE_KEY },
      });
      if (!state) {
        state = syncStateRepo.create({
          key: this.STATE_KEY,
          lastProcessedId: '0',
        });
        await syncStateRepo.save(state);
      }

      const newEvents = await targets('timeline-events', () =>
        timelineRepo.find({
          where: { id: MoreThan(state.lastProcessedId) },
          order: { id: 'ASC' },
          take: 50,
        }),
      );

      if (newEvents.length === 0) {
        return { success: true, processed: 0 };
      }

      this.logger.log(
        `Found ${newEvents.length} new timeline events to process`,
      );

      const triggeredSyncs = new Set<string>();

      for (const event of newEvents) {
        try {
          await batchDatabase(this.dataSource).transaction(async () => {
            switch (event.eventType) {
              case 'registration':
              case 'retirement':
                triggeredSyncs.add('dreps');
                break;
              case 'delegation':
                await this.handleDelegation(event);
                break;
              case 'proposal':
                triggeredSyncs.add('proposals');
                break;
              case 'vote':
                triggeredSyncs.add('votes');
                break;
            }
          });
        } catch (err) {
          if (err instanceof ProviderDeferred) throw err;

          // One bad event must not wedge the cursor — log and let the batch advance.
          this.logger.error('Failed to process timeline event');
        }
      }

      if (triggeredSyncs.has('dreps')) {
        await this.governanceSyncQueue.add(JobTypes.GOVERNANCE_SYNC, {
          syncOnly: 'dreps',
        });
        this.logger.debug('Triggered DRep sync');
      }
      if (triggeredSyncs.has('proposals')) {
        await this.proposalsSyncQueue.add(JobTypes.PROPOSALS_SYNC, {});
        this.logger.debug('Triggered proposals sync');
      }
      if (triggeredSyncs.has('votes')) {
        await this.drepVotesSyncQueue.add(JobTypes.DREP_VOTES_SYNC, {});
        this.logger.debug('Triggered votes sync');
      }

      state.lastProcessedId = newEvents[newEvents.length - 1].id;
      state.updatedAt = new Date();
      await syncStateRepo.save(state);

      return {
        success: true,
        processed: newEvents.length,
        lastId: state.lastProcessedId,
        triggers: Array.from(triggeredSyncs),
      };
    });
  }

  private async handleDelegation(event: DrepTimelineEvent): Promise<void> {
    const stakeAddress = event.metadata?.stake_address;
    if (!stakeAddress) return;

    await this.updateDelegatorVotingPower(stakeAddress);

    const prevRows = await batchDatabase(this.dataSource).query<
      { drep_id: string }[]
    >(
      `SELECT drep_id FROM drep_timeline_event
       WHERE event_type = 'delegation'
         AND metadata->>'stake_address' = $1
         AND id < $2
       ORDER BY id DESC LIMIT 1`,
      [stakeAddress, event.id],
    );
    const previousDrepId = prevRows[0]?.drep_id ?? null;

    if (!previousDrepId || previousDrepId === event.drepId) return;

    // Offset tx_index off the real cert so it clears the (tx_hash, tx_index) unique index; orIgnore keeps retries safe.
    const syntheticTxIndex = (event.txIndex ?? 0) + SYNTHETIC_TX_INDEX_OFFSET;

    const result = await batchDatabase(this.dataSource)
      .createQueryBuilder()
      .insert()
      .into(DrepTimelineEvent)
      .values({
        eventType: 'undelegation',
        timestamp: event.timestamp,
        epoch: event.epoch,
        slot: event.slot,
        txHash: event.txHash,
        txIndex: syntheticTxIndex,
        blockHash: event.blockHash,
        drepId: previousDrepId,
        stakeAddress,
        previousDrep: previousDrepId,
        metadata: { ...event.metadata, target_drep: event.drepId },
      })
      .orIgnore()
      .execute();

    if (result.identifiers.length > 0) {
      this.logger.debug('Synthesized undelegation');
    }
  }

  private async updateDelegatorVotingPower(
    stakeAddress: string,
  ): Promise<void> {
    try {
      const info =
        await this.blockfrostService.getStakeAddressInfo(stakeAddress);
      if (!info?.controlled_amount) return;

      await batchDatabase(this.dataSource)
        .createQueryBuilder()
        .update(DrepDelegator)
        .set({
          votingPowerLovelace: info.controlled_amount,
          updatedAt: new Date(),
        })
        .where('stake_address = :stakeAddress', { stakeAddress })
        .execute();
    } catch (err) {
      if (err instanceof ProviderDeferred) throw err;

      this.logger.warn('Voting power update failed');
    }
  }
}
