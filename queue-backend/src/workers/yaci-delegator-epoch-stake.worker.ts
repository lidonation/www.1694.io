import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Queues, YaciDelegatorEpochStakeJobData, YaciDelegatorEpochStakeJobResponse } from '../queue.types';
import { LOCK_DURATION_HEAVY } from '../queue.constants';
import { YaciStoreService } from '../yaci/yaci-store.service';
import { drepHashToBech32 } from '../yaci/bech32.util';

const DEFAULT_LOOKBACK = 5;
const CHUNK_SIZE = 2000;

@Injectable()
@Processor(Queues.YACI_DELEGATOR_EPOCH_STAKE, { lockDuration: LOCK_DURATION_HEAVY })
export class YaciDelegatorEpochStakeWorker extends WorkerHost {
  private readonly logger = new Logger(YaciDelegatorEpochStakeWorker.name);

  constructor(
    private readonly yaciStore: YaciStoreService,
    @InjectDataSource('default')
    private readonly db: DataSource,
  ) {
    super();
  }

  async process(job: Job<YaciDelegatorEpochStakeJobData, YaciDelegatorEpochStakeJobResponse>): Promise<YaciDelegatorEpochStakeJobResponse> {
    this.logger.log(`Starting Yaci delegator epoch stake aggregation: ${job.id}`);

    const { epochFrom, epochTo } = job.data ?? {};
    const targetEpochs = epochFrom && epochTo
      ? this.range(epochFrom, epochTo)
      : await this.detectMissingEpochs();

    if (targetEpochs.length === 0) {
      return { success: true, message: 'No epochs to process', processedEpochs: [] };
    }

    const processedEpochs: number[] = [];
    for (const epochNo of targetEpochs) {
      const rows = await this.aggregateEpoch(epochNo);
      if (rows >= 0) processedEpochs.push(epochNo);
    }

    this.logger.log(`Delegator epoch stake complete: epochs ${processedEpochs.join(', ')}`);
    return { success: true, message: `Processed ${processedEpochs.length} epochs`, processedEpochs };
  }

  private async aggregateEpoch(epochNo: number): Promise<number> {
    const boundarySlot = await this.yaciStore.getEpochBoundarySlot(epochNo);
    if (boundarySlot === null) {
      this.logger.warn(`No boundary slot for epoch ${epochNo} — skipping`);
      return -1;
    }

    const [epochStakeRows, latestDelegations] = await Promise.all([
      this.yaciStore.getEpochStake(epochNo),
      this.yaciStore.getLatestDelegationPerAddress(boundarySlot),
    ]);

    if (epochStakeRows.length === 0) {
      this.logger.warn(`No epoch_stake rows for epoch ${epochNo} — skipping`);
      return -1;
    }

    const delegMap = new Map<string, { drep_hash: string | null; drep_type: string }>();
    for (const d of latestDelegations) {
      delegMap.set(d.address, { drep_hash: d.drep_hash, drep_type: d.drep_type });
    }

    const rows: { drepId: string; stakeAddress: string; epochNo: number; amountLovelace: string }[] = [];

    for (const row of epochStakeRows) {
      const deleg = delegMap.get(row.stake_address);
      if (!deleg?.drep_hash) continue;
      if (deleg.drep_type === 'ALWAYS_ABSTAIN') continue;

      const drepId = drepHashToBech32(deleg.drep_hash, deleg.drep_type);
      rows.push({
        drepId,
        stakeAddress: row.stake_address,
        epochNo,
        amountLovelace: row.amount,
      });
    }

    if (rows.length === 0) return 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      await this.db.query(
        `INSERT INTO drep_delegator_epoch_stake (drep_id, stake_address, epoch_no, amount_lovelace)
         SELECT * FROM UNNEST($1::text[], $2::text[], $3::int[], $4::bigint[])
         ON CONFLICT (drep_id, stake_address, epoch_no) DO UPDATE
           SET amount_lovelace = EXCLUDED.amount_lovelace`,
        [
          chunk.map(r => r.drepId),
          chunk.map(r => r.stakeAddress),
          chunk.map(r => r.epochNo),
          chunk.map(r => r.amountLovelace),
        ],
      );
    }

    this.logger.log(`Epoch ${epochNo}: wrote ${rows.length} delegator stake rows`);
    return rows.length;
  }

  private async detectMissingEpochs(): Promise<number[]> {
    const existing = await this.db.query<{ epoch_no: number }[]>(
      `SELECT DISTINCT epoch_no FROM drep_delegator_epoch_stake ORDER BY epoch_no DESC LIMIT 1`,
    );
    const latestKnown = existing[0]?.epoch_no ?? 0;

    const latestSlotRows = await this.db.query<{ slot: string }[]>(
      `SELECT slot FROM drep_timeline_event ORDER BY slot DESC LIMIT 1`,
    );
    const latestSlot = latestSlotRows[0] ? Number(latestSlotRows[0].slot) : 0;
    const currentEpoch = latestSlot > 4492800
      ? Math.floor((latestSlot - 4492800) / 432000) + 208
      : latestKnown;

    const start = Math.max(latestKnown === 0 ? currentEpoch - DEFAULT_LOOKBACK : latestKnown, 0);
    return this.range(start, currentEpoch);
  }

  private range(from: number, to: number): number[] {
    const result: number[] = [];
    for (let i = from; i <= to; i++) result.push(i);
    return result;
  }
}
