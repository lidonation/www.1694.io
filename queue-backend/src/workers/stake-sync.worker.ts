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

@Injectable()
@Processor(Queues.STAKE_SYNC, { lockDuration: LOCK_DURATION_MEDIUM })
export class StakeSyncWorker extends WorkerHost {
  private readonly logger = new Logger(StakeSyncWorker.name);

  constructor(
    private readonly blockfrostService: BlockfrostService,
    @InjectDataSource('default')
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(
    job: Job<StakeSyncJobData, StakeSyncJobResponse>,
  ): Promise<StakeSyncJobResponse> {
    this.logger.log(`Starting stake sync: ${job.id}`);

    try {
      const source = await this.blockfrostService.assertGovernanceSourceFresh();
      if (!source.ok) {
        this.logger.error(`Aborting stake sync: ${source.reason}`);
        return { success: false, message: source.reason };
      }

      const epochNo = source.epoch;
      const drepsRepo = this.dataSource.getRepository(Drep);
      const delegatorsRepo = this.dataSource.getRepository(DrepDelegator);
      const epochStakeRepo = this.dataSource.getRepository(DrepEpochStake);
      const dreps = await drepsRepo.find();

      let updated = 0;
      const epochSnapshots: Partial<DrepEpochStake>[] = [];

      for (const d of dreps) {
        try {
          const info = await this.blockfrostService.getDRepInfo(d.drepId);
          // Only write a numeric lovelace amount. `info.amount` is a string, so
          // the prior `if (info.amount)` accepted "0" and stub values as truthy
          // and let bad upstreams overwrite real voting power. A genuine 0 is
          // valid (the source is verified fresh above); null/non-numeric is not.
          const lovelace = info?.amount;
          const amount = lovelace == null ? NaN : Number(lovelace);
          if (Number.isFinite(amount) && amount >= 0) {
            const isActive = info.active || false;
            await drepsRepo.update(
              { drepId: d.drepId },
              {
                votingPowerAda: (amount / 1_000_000).toString(),
                active: isActive,
                retired: info.retired || false,
                expired: info.expired || false,
                lastActiveEpoch: info.last_active_epoch,
                snapshotEpochNo: epochNo,
                updatedAt: new Date(),
              },
            );
            epochSnapshots.push({
              drepId: d.drepId,
              epochNo,
              amountLovelace: String(lovelace),
              active: isActive,
            });
            updated++;
          } else {
            this.logger.warn(
              `Skipping ${d.drepId}: non-numeric amount "${lovelace}"`,
            );
          }
          await new Promise((r) => setTimeout(r, 20));
        } catch (e) {
          this.logger.warn(`DRep stake failed (${d.drepId}): ${e.message}`);
        }
      }

      // Upsert epoch snapshots in chunks — this is our drep_distr equivalent
      const chunkSize = 500;
      for (let i = 0; i < epochSnapshots.length; i += chunkSize) {
        await epochStakeRepo.upsert(
          epochSnapshots.slice(i, i + chunkSize) as any,
          {
            conflictPaths: ['drepId', 'epochNo'],
            skipUpdateIfNoValuesChanged: true,
          },
        );
      }

      const updatedDelegators =
        await this.syncDelegatorVotingPower(delegatorsRepo);
      this.logger.log(
        `Stake sync completed: ${updated} DReps, ${updatedDelegators} delegators`,
      );

      return {
        success: true,
        message: `Updated ${updated} DReps, ${updatedDelegators} delegators`,
        updatedDRepsCount: updated,
        updatedDelegatorsCount: updatedDelegators,
        epochNo,
      };
    } catch (e) {
      this.logger.error(`Stake sync failed: ${e.message}`, e.stack);
      return { success: false, message: e.message };
    }
  }

  private async syncDelegatorVotingPower(repo): Promise<number> {
    const targets = await repo
      .createQueryBuilder('d')
      .where(
        "d.voting_power_lovelace IS NULL OR d.updated_at < NOW() - INTERVAL '1 day'",
      )
      .limit(100)
      .getMany();

    let count = 0;
    for (const d of targets) {
      try {
        const info = await this.blockfrostService.getStakeAddressInfo(
          d.stakeAddress,
        );
        if (info?.controlled_amount) {
          await repo.update(
            { drepId: d.drepId, stakeAddress: d.stakeAddress },
            {
              votingPowerLovelace: info.controlled_amount,
              updatedAt: new Date(),
            },
          );
          count++;
        }
        await new Promise((r) => setTimeout(r, 100));
      } catch (e) {
        this.logger.warn(
          `Delegator VP failed (${d.stakeAddress}): ${e.message}`,
        );
      }
    }
    return count;
  }
}
