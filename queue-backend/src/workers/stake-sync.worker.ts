import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Queues, StakeSyncJobData, StakeSyncJobResponse } from '../queue.types';
import { LOCK_DURATION_MEDIUM } from '../queue.constants';
import { BlockfrostService } from '../blockfrost/blockfrost.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Drep } from '../entities/governance/drep.entity';
import { DrepDelegator } from '../entities/governance/drep-delegator.entity';
import { DrepEpochStake } from '../entities/governance/drep-epoch-stake.entity';
import { ProviderDeferred } from '../blockfrost/request-budget';
import {
  batchDatabase,
  runBatch,
  syncItem,
  targets,
  stakeEpoch,
} from '../blockfrost/sync-run';

@Injectable()
@Processor(Queues.STAKE_SYNC, { lockDuration: LOCK_DURATION_MEDIUM })
export class StakeSyncWorker extends WorkerHost {
  private readonly logger = new Logger(StakeSyncWorker.name);
  constructor(
    private readonly blockfrostService: BlockfrostService,
    @InjectDataSource('default') private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(
    job: Job<StakeSyncJobData, StakeSyncJobResponse>,
    token?: string,
  ): Promise<StakeSyncJobResponse> {
    return runBatch(this.dataSource, job, token, async () => {
      const source = await this.blockfrostService.assertGovernanceSourceFresh();
      if (!source.ok)
        throw new ProviderDeferred('source', 'transient', Date.now() + 60000);
      const epochNo = source.epoch;
      await stakeEpoch(epochNo);
      const dreps = await targets('stake-dreps', () =>
        batchDatabase(this.dataSource)
          .getRepository(Drep)
          .find({ order: { drepId: 'ASC' } }),
      );
      let updated = 0;
      for (const d of dreps) {
        updated += await syncItem(`stake:${d.drepId}`, async () => {
          let info: any;
          try {
            info = await this.blockfrostService.getDRepInfo(d.drepId);
          } catch (e) {
            if (e.status === 404) return 0;
            throw e;
          }
          const amount = info?.amount == null ? NaN : Number(info.amount);
          if (!Number.isFinite(amount) || amount < 0)
            throw new ProviderDeferred(
              'source',
              'transient',
              Date.now() + 60000,
            );
          // Detail and epoch snapshot commit together; replay cannot leave half a snapshot.
          await batchDatabase(this.dataSource).transaction(async (manager) => {
            await manager.getRepository(Drep).update(
              { drepId: d.drepId },
              {
                votingPowerAda: (amount / 1_000_000).toString(),
                active: info.active || false,
                retired: info.retired || false,
                expired: info.expired || false,
                lastActiveEpoch: info.last_active_epoch,
                snapshotEpochNo: epochNo,
                updatedAt: new Date(),
              },
            );
            await manager.getRepository(DrepEpochStake).upsert(
              {
                drepId: d.drepId,
                epochNo,
                amountLovelace: String(info.amount),
                active: info.active || false,
              },
              {
                conflictPaths: ['drepId', 'epochNo'],
                skipUpdateIfNoValuesChanged: true,
              },
            );
          });
          return 1;
        });
      }
      const updatedDelegators = await this.syncDelegatorVotingPower();
      this.logger.log('Stake sync completed');
      return {
        success: true,
        message: 'Updated stake data',
        updatedDRepsCount: updated,
        updatedDelegatorsCount: updatedDelegators,
        epochNo,
      };
    });
  }
  private async syncDelegatorVotingPower(): Promise<number> {
    const repo = batchDatabase(this.dataSource).getRepository(DrepDelegator);
    const delegators = await targets('stake-delegators', () =>
      repo
        .createQueryBuilder('d')
        .where(
          "d.voting_power_lovelace IS NULL OR d.updated_at < NOW() - INTERVAL '1 day'",
        )
        .orderBy('d.drepId', 'ASC')
        .addOrderBy('d.stakeAddress', 'ASC')
        .limit(100)
        .getMany(),
    );
    let count = 0;
    for (const d of delegators) {
      count += await syncItem(
        `delegator-power:${d.drepId}:${d.stakeAddress}`,
        async () => {
          let info: any;
          try {
            info = await this.blockfrostService.getStakeAddressInfo(
              d.stakeAddress,
            );
          } catch (e) {
            if (e.status === 404) return 0;
            throw e;
          }
          if (info?.controlled_amount == null)
            throw new ProviderDeferred(
              'source',
              'transient',
              Date.now() + 60000,
            );
          await repo.update(
            { drepId: d.drepId, stakeAddress: d.stakeAddress },
            {
              votingPowerLovelace: info.controlled_amount,
              updatedAt: new Date(),
            },
          );
          return 1;
        },
      );
    }
    return count;
  }
}
