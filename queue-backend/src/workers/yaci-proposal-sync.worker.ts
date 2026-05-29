import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Queues, YaciProposalSyncJobData, YaciProposalSyncJobResponse } from '../queue.types';
import { LOCK_DURATION_MEDIUM } from '../queue.constants';
import { YaciStoreService } from '../yaci/yaci-store.service';
import { SyncState } from '../entities/sync-state.entity';

const SYNC_KEY = 'yaci_proposal_slot';
const CHUNK_SIZE = 200;

const GOV_TYPE_MAP: Record<string, string> = {
  HARD_FORK_INITIATION_ACTION: 'hard_fork_initiation',
  NEW_COMMITTEE:               'new_committee',
  NEW_CONSTITUTION:            'new_constitution',
  INFO_ACTION:                 'info_action',
  NO_CONFIDENCE:               'no_confidence',
  PARAMETER_CHANGE_ACTION:     'parameter_change',
  TREASURY_WITHDRAWALS_ACTION: 'treasury_withdrawals',
};

@Injectable()
@Processor(Queues.YACI_PROPOSAL_SYNC, { lockDuration: LOCK_DURATION_MEDIUM })
export class YaciProposalSyncWorker extends WorkerHost {
  private readonly logger = new Logger(YaciProposalSyncWorker.name);

  constructor(
    private readonly yaciStore: YaciStoreService,
    @InjectDataSource('default')
    private readonly db: DataSource,
  ) {
    super();
  }

  async process(job: Job<YaciProposalSyncJobData, YaciProposalSyncJobResponse>): Promise<YaciProposalSyncJobResponse> {
    this.logger.log(`Starting Yaci proposal sync: ${job.id}`);

    const syncState = this.db.getRepository(SyncState);
    const state = await syncState.findOne({ where: { key: SYNC_KEY } });
    const sinceSlot = BigInt(state?.lastProcessedId ?? '0');

    const proposals = await this.yaciStore.getNewProposals(sinceSlot);
    if (proposals.length === 0) {
      return { success: true, message: 'No new proposals', upserted: 0 };
    }

    let upserted = 0;
    for (let i = 0; i < proposals.length; i += CHUNK_SIZE) {
      const chunk = proposals.slice(i, i + CHUNK_SIZE);
      await this.db.query(
        `INSERT INTO proposals
           (id, tx_hash, cert_index, governance_type, deposit_lovelace, return_stake_address,
            ratified_epoch, enacted_epoch, dropped_epoch, expired_epoch, expiration_epoch, block_time, created_at, updated_at)
         SELECT * FROM UNNEST(
           $1::text[], $2::text[], $3::int[], $4::text[], $5::bigint[], $6::text[],
           $7::int[], $8::int[], $9::int[], $10::int[], $11::int[], $12::timestamptz[], $13::timestamptz[], $14::timestamptz[]
         )
         ON CONFLICT (id) DO UPDATE SET
           ratified_epoch   = COALESCE(EXCLUDED.ratified_epoch,   proposals.ratified_epoch),
           enacted_epoch    = COALESCE(EXCLUDED.enacted_epoch,    proposals.enacted_epoch),
           dropped_epoch    = COALESCE(EXCLUDED.dropped_epoch,    proposals.dropped_epoch),
           expired_epoch    = COALESCE(EXCLUDED.expired_epoch,    proposals.expired_epoch),
           expiration_epoch = COALESCE(EXCLUDED.expiration_epoch, proposals.expiration_epoch),
           updated_at       = EXCLUDED.updated_at`,
        [
          chunk.map(p => `${p.tx_hash}#${p.index}`),
          chunk.map(p => p.tx_hash),
          chunk.map(p => p.index),
          chunk.map(p => GOV_TYPE_MAP[p.type] ?? p.type?.toLowerCase() ?? 'info_action'),
          chunk.map(p => p.deposit ? BigInt(p.deposit).toString() : null),
          chunk.map(p => p.return_address),
          chunk.map(p => p.ratified_epoch ?? null),
          chunk.map(p => p.enacted_epoch ?? null),
          chunk.map(p => p.dropped_epoch ?? null),
          chunk.map(p => p.expired_epoch ?? null),
          chunk.map(p => p.expiration ?? null),
          chunk.map(p => p.block_time ? new Date(Number(p.block_time) * 1000) : null),
          chunk.map(() => new Date()),
          chunk.map(() => new Date()),
        ],
      );
      upserted += chunk.length;
    }

    const maxSlot = proposals.reduce((m, p) => (BigInt(p.slot) > m ? BigInt(p.slot) : m), sinceSlot);
    await syncState.upsert(
      { key: SYNC_KEY, lastProcessedId: maxSlot.toString(), updatedAt: new Date() } as any,
      { conflictPaths: ['key'] },
    );

    this.logger.log(`Proposal sync: ${upserted} upserted`);
    return { success: true, message: `Upserted ${upserted} proposals`, upserted };
  }
}
