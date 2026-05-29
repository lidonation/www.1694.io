import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Queues, YaciTimelineSyncJobData, YaciTimelineSyncJobResponse } from '../queue.types';
import { LOCK_DURATION_MEDIUM } from '../queue.constants';
import { YaciStoreService } from '../yaci/yaci-store.service';
import { drepHashToBech32, voterHashToBech32, isDrepVoter } from '../yaci/bech32.util';
import { SyncState } from '../entities/sync-state.entity';

const SYNC_KEY = 'yaci_timeline_slot';
const BATCH_SIZE = 500;

@Injectable()
@Processor(Queues.YACI_TIMELINE_SYNC, { lockDuration: LOCK_DURATION_MEDIUM })
export class YaciTimelineSyncWorker extends WorkerHost {
  private readonly logger = new Logger(YaciTimelineSyncWorker.name);

  constructor(
    private readonly yaciStore: YaciStoreService,
    @InjectDataSource('default')
    private readonly db: DataSource,
  ) {
    super();
  }

  async process(job: Job<YaciTimelineSyncJobData, YaciTimelineSyncJobResponse>): Promise<YaciTimelineSyncJobResponse> {
    this.logger.log(`Starting Yaci timeline sync: ${job.id}`);

    const syncState = this.db.getRepository(SyncState);
    const state = await syncState.findOne({ where: { key: SYNC_KEY } });
    const sinceSlot = BigInt(state?.lastProcessedId ?? '0');

    const [registrations, delegations, proposals, votes] = await Promise.all([
      this.yaciStore.getNewRegistrations(sinceSlot),
      this.yaciStore.getNewDelegations(sinceSlot),
      this.yaciStore.getNewProposals(sinceSlot),
      this.yaciStore.getNewVotes(sinceSlot),
    ]);

    const total = registrations.length + delegations.length + proposals.length + votes.length;
    if (total === 0) {
      return { success: true, message: 'No new events', inserted: 0 };
    }

    const events: any[] = [
      ...registrations.map(r => this.mapRegistration(r)),
      ...delegations.map(d => this.mapDelegation(d)),
      ...proposals.map(p => this.mapProposal(p)),
      ...votes.map(v => this.mapVote(v)),
    ];

    let inserted = 0;
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);
      const result = await this.db.query(
        `INSERT INTO drep_timeline_event
           (event_type, timestamp, epoch, slot, tx_hash, tx_index, block_hash, drep_id, metadata, stake_address, previous_drep)
         SELECT * FROM UNNEST(
           $1::text[], $2::timestamptz[], $3::int[], $4::bigint[], $5::text[], $6::int[],
           $7::text[], $8::text[], $9::jsonb[], $10::text[], $11::text[]
         )
         ON CONFLICT (tx_hash, tx_index, event_type) DO NOTHING`,
        [
          batch.map(e => e.event_type),
          batch.map(e => e.timestamp),
          batch.map(e => e.epoch),
          batch.map(e => e.slot),
          batch.map(e => e.tx_hash),
          batch.map(e => e.tx_index),
          batch.map(e => e.block_hash),
          batch.map(e => e.drep_id),
          batch.map(e => JSON.stringify(e.metadata)),
          batch.map(e => e.stake_address),
          batch.map(e => e.previous_drep),
        ],
      );
      inserted += result[1] ?? 0;
    }

    // Advance the checkpoint to the highest slot we processed
    const maxSlot = events.reduce((m, e) => (BigInt(e.slot) > m ? BigInt(e.slot) : m), sinceSlot);
    await syncState.upsert(
      { key: SYNC_KEY, lastProcessedId: maxSlot.toString(), updatedAt: new Date() } as any,
      { conflictPaths: ['key'] },
    );

    this.logger.log(`Yaci timeline sync: ${inserted} inserted from ${total} events (slot ${sinceSlot} → ${maxSlot})`);
    return { success: true, message: `Inserted ${inserted} / ${total} events`, inserted };
  }

  private mapRegistration(r: any) {
    const drepId = drepHashToBech32(r.drep_hash, r.drep_type);
    const eventType = r.action_type === 'UNREGISTER' ? 'retirement' : 'registration';
    return {
      event_type: eventType,
      timestamp: r.block_time ?? new Date().toISOString(),
      epoch: r.epoch,
      slot: BigInt(r.slot),
      tx_hash: r.tx_hash,
      tx_index: r.cert_index,
      block_hash: r.block_hash,
      drep_id: drepId,
      metadata: {
        drep_id: drepId,
        deposit: r.deposit ? Number(r.deposit) : null,
        anchor_url: r.anchor_url,
        anchor_hash: r.anchor_hash,
        tx_hash: r.tx_hash,
        epoch_no: r.epoch,
      },
      stake_address: null,
      previous_drep: null,
    };
  }

  private mapDelegation(d: any) {
    const targetDrep = d.drep_hash ? drepHashToBech32(d.drep_hash, d.drep_type) : null;
    return {
      event_type: 'delegation',
      timestamp: d.block_time ?? new Date().toISOString(),
      epoch: d.epoch,
      slot: BigInt(d.slot),
      tx_hash: d.tx_hash,
      tx_index: d.cert_index,
      block_hash: d.block_hash,
      drep_id: targetDrep,
      metadata: {
        stake_address: d.address,
        target_drep: targetDrep,
        current_drep: targetDrep,
        drep_has_script: d.drep_type === 'SCRIPTHASH',
        tx_hash: d.tx_hash,
        timestamp: d.block_time ?? new Date().toISOString(),
        delegation_epoch: d.epoch,
        total_stake: '0',
        added_power: true,
      },
      stake_address: d.address,
      previous_drep: null,
    };
  }

  private mapProposal(p: any) {
    const actionId = `${p.tx_hash}#${p.index}`;
    return {
      event_type: 'proposal',
      timestamp: p.block_time ?? new Date().toISOString(),
      epoch: p.epoch,
      slot: BigInt(p.slot),
      tx_hash: p.tx_hash,
      tx_index: p.index,
      block_hash: p.block_hash,
      drep_id: null,
      metadata: {
        index: p.index,
        action_type: p.type,
        deposit: p.deposit ? Number(p.deposit) : null,
        anchor_url: p.anchor_url,
        anchor_hash: p.anchor_hash,
        reward_account: p.return_address,
        details: p.details ?? {},
        action_id: actionId,
      },
      stake_address: null,
      previous_drep: null,
    };
  }

  private mapVote(v: any) {
    const voterId = voterHashToBech32(v.voter_hash, v.voter_type);
    const actionId = `${v.gov_action_tx_hash}#${v.gov_action_index}`;
    const drepId = isDrepVoter(v.voter_type) ? voterId : null;
    return {
      event_type: 'vote',
      timestamp: v.block_time ?? new Date().toISOString(),
      epoch: v.epoch,
      slot: BigInt(v.slot),
      tx_hash: v.tx_hash,
      tx_index: v.index,
      block_hash: v.block_hash,
      drep_id: drepId,
      metadata: {
        voter_id: voterId,
        proposal_tx_hash: v.gov_action_tx_hash,
        proposal_index: v.gov_action_index,
        vote: v.vote?.toLowerCase() ?? 'abstain',
        anchor_url: v.anchor_url,
        anchor_hash: v.anchor_hash,
        action_id: actionId,
        view: voterId,
        gov_action_proposal_id: v.gov_action_tx_hash,
        time_voted: v.block_time ?? new Date().toISOString(),
        voting_epoch: v.epoch,
        vote_rationale: v.anchor_url ?? '',
        url: v.anchor_url ?? '',
      },
      stake_address: null,
      previous_drep: null,
    };
  }
}
