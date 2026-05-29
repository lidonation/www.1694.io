import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Queues, YaciEpochStakeJobData, YaciEpochStakeJobResponse } from '../queue.types';
import { LOCK_DURATION_HEAVY } from '../queue.constants';
import { YaciStoreService } from '../yaci/yaci-store.service';
import { drepHashToBech32 } from '../yaci/bech32.util';

const DEFAULT_LOOKBACK = 5;
const CHUNK_SIZE = 1000;

@Injectable()
@Processor(Queues.YACI_EPOCH_STAKE, { lockDuration: LOCK_DURATION_HEAVY })
export class YaciEpochStakeWorker extends WorkerHost {
  private readonly logger = new Logger(YaciEpochStakeWorker.name);

  constructor(
    private readonly yaciStore: YaciStoreService,
    @InjectDataSource('default')
    private readonly db: DataSource,
  ) {
    super();
  }

  async process(job: Job<YaciEpochStakeJobData, YaciEpochStakeJobResponse>): Promise<YaciEpochStakeJobResponse> {
    this.logger.log(`Starting Yaci epoch stake aggregation: ${job.id}`);

    const { epochFrom, epochTo } = job.data ?? {};

    const targetEpochs = epochFrom && epochTo
      ? this.range(epochFrom, epochTo)
      : await this.detectMissingEpochs();

    if (targetEpochs.length === 0) {
      return { success: true, message: 'No epochs to process', processedEpochs: [] };
    }

    const processedEpochs: number[] = [];

    for (const epochNo of targetEpochs) {
      const upserted = await this.aggregateEpoch(epochNo);
      if (upserted >= 0) processedEpochs.push(epochNo);
    }

    this.logger.log(`Epoch stake aggregation complete: epochs ${processedEpochs.join(', ')}`);
    return { success: true, message: `Processed ${processedEpochs.length} epochs`, processedEpochs };
  }

  private async aggregateEpoch(epochNo: number): Promise<number> {
    const boundarySlot = await this.yaciStore.getEpochBoundarySlot(epochNo);
    if (boundarySlot === null) {
      this.logger.warn(`No epoch boundary slot found for epoch ${epochNo} — skipping`);
      return -1;
    }

    const [epochStakeRows, latestDelegations] = await Promise.all([
      this.yaciStore.getEpochStake(epochNo),
      this.yaciStore.getLatestDelegationPerAddress(boundarySlot),
    ]);

    if (epochStakeRows.length === 0) {
      this.logger.warn(`epoch_stake table has no rows for epoch ${epochNo} — skipping`);
      return -1;
    }

    // Build delegation lookup: stake_address → { drep_hash, drep_type }
    const delegMap = new Map<string, { drep_hash: string | null; drep_type: string }>();
    for (const d of latestDelegations) {
      delegMap.set(d.address, { drep_hash: d.drep_hash, drep_type: d.drep_type });
    }

    // Aggregate stake per DRep
    const drepStake = new Map<string, { bech32: string; lovelace: bigint }>();
    for (const row of epochStakeRows) {
      const deleg = delegMap.get(row.stake_address);
      if (!deleg?.drep_hash) continue;
      if (deleg.drep_type === 'ALWAYS_ABSTAIN') continue;

      const drepId = drepHashToBech32(deleg.drep_hash, deleg.drep_type);
      const existing = drepStake.get(deleg.drep_hash);
      const lovelace = BigInt(row.amount);
      if (existing) {
        existing.lovelace += lovelace;
      } else {
        drepStake.set(deleg.drep_hash, { bech32: drepId, lovelace });
      }
    }

    // Also add always_no_confidence bucket (not excluded from eligible)
    let noConfidenceLovelace = 0n;
    for (const row of epochStakeRows) {
      const deleg = delegMap.get(row.stake_address);
      if (deleg?.drep_type === 'ALWAYS_NO_CONFIDENCE') {
        noConfidenceLovelace += BigInt(row.amount);
      }
    }
    if (noConfidenceLovelace > 0n) {
      drepStake.set('drep_always_no_confidence', {
        bech32: 'drep_always_no_confidence',
        lovelace: noConfidenceLovelace,
      });
    }

    if (drepStake.size === 0) {
      this.logger.warn(`No DRep stake to write for epoch ${epochNo}`);
      return 0;
    }

    const rows = Array.from(drepStake.values()).map(({ bech32, lovelace }) => ({
      drepId: bech32,
      epochNo,
      amountLovelace: lovelace.toString(),
      active: true,
    }));

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      await this.db.query(
        `INSERT INTO drep_epoch_stake (drep_id, epoch_no, amount_lovelace, active)
         SELECT * FROM UNNEST($1::text[], $2::int[], $3::bigint[], $4::bool[])
         ON CONFLICT (drep_id, epoch_no) DO UPDATE
           SET amount_lovelace = EXCLUDED.amount_lovelace,
               active          = EXCLUDED.active`,
        [
          rows.slice(i, i + CHUNK_SIZE).map(r => r.drepId),
          rows.slice(i, i + CHUNK_SIZE).map(r => r.epochNo),
          rows.slice(i, i + CHUNK_SIZE).map(r => r.amountLovelace),
          rows.slice(i, i + CHUNK_SIZE).map(r => r.active),
        ],
      );
    }

    this.logger.log(`Epoch ${epochNo}: wrote ${rows.length} DRep stake rows`);
    return rows.length;
  }

  private async detectMissingEpochs(): Promise<number[]> {
    // Find the latest epoch in yaci's epoch table
    const latestRow = await this.yaciStore.getEpochBoundarySlot(9999).then(() => null).catch(() => null);

    // Fall back to checking voltaire_db for latest epoch we have
    const rows = await this.db.query<{ epoch_no: number }[]>(
      `SELECT DISTINCT epoch_no FROM drep_epoch_stake ORDER BY epoch_no DESC LIMIT 1`,
    );
    const latestKnown = rows[0]?.epoch_no ?? 0;

    // Try to compute the current epoch from the latest block slot (approximate)
    const EPOCH_ANCHOR_SLOT = 4492800;
    const EPOCH_LENGTH = 432000;
    const latestSlotRows = await this.db.query<{ slot: string }[]>(
      `SELECT slot FROM drep_timeline_event ORDER BY slot DESC LIMIT 1`,
    );
    const latestSlot = latestSlotRows[0] ? Number(latestSlotRows[0].slot) : 0;
    const currentEpoch = latestSlot > EPOCH_ANCHOR_SLOT
      ? Math.floor((latestSlot - EPOCH_ANCHOR_SLOT) / EPOCH_LENGTH) + 208
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
