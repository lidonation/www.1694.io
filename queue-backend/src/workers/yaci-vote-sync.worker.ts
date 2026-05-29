import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Queues, YaciVoteSyncJobData, YaciVoteSyncJobResponse } from '../queue.types';
import { LOCK_DURATION_MEDIUM } from '../queue.constants';
import { YaciStoreService } from '../yaci/yaci-store.service';
import { voterHashToBech32 } from '../yaci/bech32.util';
import { SyncState } from '../entities/sync-state.entity';

const SYNC_KEY = 'yaci_vote_slot';
const CHUNK_SIZE = 500;

const VOTER_ROLE_MAP: Record<string, string> = {
  DREP_KEY_HASH:                              'drep',
  DREP_SCRIPT_HASH:                           'drep',
  CONSTITUTIONAL_COMMITTEE_HOT_KEY_HASH:      'constitutional_committee',
  CONSTITUTIONAL_COMMITTEE_HOT_SCRIPT_HASH:   'constitutional_committee',
  STAKE_POOL_KEY_HASH:                        'spo',
};

@Injectable()
@Processor(Queues.YACI_VOTE_SYNC, { lockDuration: LOCK_DURATION_MEDIUM })
export class YaciVoteSyncWorker extends WorkerHost {
  private readonly logger = new Logger(YaciVoteSyncWorker.name);

  constructor(
    private readonly yaciStore: YaciStoreService,
    @InjectDataSource('default')
    private readonly db: DataSource,
  ) {
    super();
  }

  async process(job: Job<YaciVoteSyncJobData, YaciVoteSyncJobResponse>): Promise<YaciVoteSyncJobResponse> {
    this.logger.log(`Starting Yaci vote sync: ${job.id}`);

    const syncState = this.db.getRepository(SyncState);
    const state = await syncState.findOne({ where: { key: SYNC_KEY } });
    const sinceSlot = BigInt(state?.lastProcessedId ?? '0');

    const votes = await this.yaciStore.getVotesSince(sinceSlot);
    if (votes.length === 0) {
      return { success: true, message: 'No new votes', upserted: 0 };
    }

    let upserted = 0;
    for (let i = 0; i < votes.length; i += CHUNK_SIZE) {
      const chunk = votes.slice(i, i + CHUNK_SIZE);
      await this.db.query(
        `INSERT INTO proposal_votes
           (proposal_id, tx_hash, cert_index, voter_role, voter, vote, block_time, created_at, updated_at)
         SELECT * FROM UNNEST(
           $1::text[], $2::text[], $3::int[], $4::text[], $5::text[], $6::text[],
           $7::timestamptz[], $8::timestamptz[], $9::timestamptz[]
         )
         ON CONFLICT (proposal_id, voter) DO UPDATE SET
           vote       = EXCLUDED.vote,
           block_time = COALESCE(EXCLUDED.block_time, proposal_votes.block_time),
           updated_at = EXCLUDED.updated_at`,
        [
          chunk.map(v => `${v.gov_action_tx_hash}#${v.gov_action_index}`),
          chunk.map(v => v.tx_hash),
          chunk.map(v => v.index),
          chunk.map(v => VOTER_ROLE_MAP[v.voter_type] ?? 'drep'),
          chunk.map(v => voterHashToBech32(v.voter_hash, v.voter_type)),
          chunk.map(v => v.vote?.toLowerCase() ?? 'abstain'),
          chunk.map(v => v.block_time ? new Date(Number(v.block_time) * 1000) : null),
          chunk.map(() => new Date()),
          chunk.map(() => new Date()),
        ],
      );
      upserted += chunk.length;
    }

    const maxSlot = votes.reduce((m, v) => (BigInt(v.slot) > m ? BigInt(v.slot) : m), sinceSlot);
    await syncState.upsert(
      { key: SYNC_KEY, lastProcessedId: maxSlot.toString(), updatedAt: new Date() } as any,
      { conflictPaths: ['key'] },
    );

    this.logger.log(`Vote sync: ${upserted} upserted`);
    return { success: true, message: `Upserted ${upserted} votes`, upserted };
  }
}
