import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface YaciDrepRegistration {
  tx_hash: string;
  cert_index: number;
  action_type: 'REGISTER' | 'UPDATE' | 'UNREGISTER';
  drep_hash: string;
  drep_type: string;
  anchor_url: string | null;
  anchor_hash: string | null;
  deposit: string | null;
  slot: string;
  epoch: number;
  block_time: string | null;
  block_hash: string | null;
}

export interface YaciDelegationVote {
  tx_hash: string;
  cert_index: number;
  address: string;
  drep_hash: string | null;
  drep_type: string;
  slot: string;
  epoch: number;
  block_time: string | null;
  block_hash: string | null;
}

export interface YaciGovActionProposal {
  tx_hash: string;
  index: number;
  deposit: string | null;
  return_address: string | null;
  type: string;
  anchor_url: string | null;
  anchor_hash: string | null;
  details: any;
  slot: string;
  epoch: number;
  block_time: string | null;
  block_hash: string | null;
  ratified_epoch: number | null;
  enacted_epoch: number | null;
  dropped_epoch: number | null;
  expired_epoch: number | null;
  expiration: number | null;
}

export interface YaciVotingProcedure {
  tx_hash: string;
  index: number;
  voter_hash: string;
  voter_type: string;
  gov_action_tx_hash: string;
  gov_action_index: number;
  vote: string;
  anchor_url: string | null;
  anchor_hash: string | null;
  slot: string;
  epoch: number;
  block_time: string | null;
  block_hash: string | null;
}

export interface YaciEpochStakeRow {
  stake_address: string;
  epoch_no: number;
  amount: string;
}

export interface YaciDelegationLatest {
  address: string;
  drep_hash: string | null;
  drep_type: string;
}

@Injectable()
export class YaciStoreService {
  private readonly logger = new Logger(YaciStoreService.name);
  private readonly available: boolean;

  constructor(
    @InjectDataSource('yaci_store')
    private readonly db: DataSource,
  ) {
    this.available = !!db;
  }

  private guard(): boolean {
    if (!this.available) {
      this.logger.warn('Yaci Store DataSource not available — YACI_STORE_DB_* vars may be unset');
      return false;
    }
    return true;
  }

  async getNewRegistrations(sinceSlot: bigint): Promise<YaciDrepRegistration[]> {
    if (!this.guard()) return [];
    return this.db.query<YaciDrepRegistration[]>(
      `SELECT tx_hash, cert_index, action_type, drep_hash, drep_type,
              anchor_url, anchor_hash, deposit, slot, epoch, block_time, block_hash
       FROM drep_registration
       WHERE slot > $1
       ORDER BY slot, cert_index`,
      [sinceSlot.toString()],
    );
  }

  async getNewDelegations(sinceSlot: bigint): Promise<YaciDelegationVote[]> {
    if (!this.guard()) return [];
    return this.db.query<YaciDelegationVote[]>(
      `SELECT tx_hash, cert_index, address, drep_hash, drep_type,
              slot, epoch, block_time, block_hash
       FROM delegation_vote
       WHERE slot > $1
       ORDER BY slot, cert_index`,
      [sinceSlot.toString()],
    );
  }

  async getNewProposals(sinceSlot: bigint): Promise<YaciGovActionProposal[]> {
    if (!this.guard()) return [];
    return this.db.query<YaciGovActionProposal[]>(
      `SELECT tx_hash, index, deposit, return_address, type,
              anchor_url, anchor_hash, details, slot, epoch, block_time, block_hash,
              ratified_epoch, enacted_epoch, dropped_epoch, expired_epoch, expiration
       FROM gov_action_proposal
       WHERE slot > $1
       ORDER BY slot, index`,
      [sinceSlot.toString()],
    );
  }

  async getNewVotes(sinceSlot: bigint): Promise<YaciVotingProcedure[]> {
    if (!this.guard()) return [];
    return this.db.query<YaciVotingProcedure[]>(
      `SELECT tx_hash, index, voter_hash, voter_type, gov_action_tx_hash, gov_action_index,
              vote, anchor_url, anchor_hash, slot, epoch, block_time, block_hash
       FROM voting_procedure
       WHERE slot > $1
       ORDER BY slot, index`,
      [sinceSlot.toString()],
    );
  }

  async getEpochBoundarySlot(epochNo: number): Promise<bigint | null> {
    if (!this.guard()) return null;
    const rows = await this.db.query<{ start_slot: string }[]>(
      `SELECT start_slot FROM epoch WHERE epoch_no = $1 LIMIT 1`,
      [epochNo],
    );
    return rows[0] ? BigInt(rows[0].start_slot) : null;
  }

  async getEpochStake(epochNo: number): Promise<YaciEpochStakeRow[]> {
    if (!this.guard()) return [];
    return this.db.query<YaciEpochStakeRow[]>(
      `SELECT stake_address, epoch_no, amount
       FROM epoch_stake
       WHERE epoch_no = $1`,
      [epochNo],
    );
  }

  async getLatestDelegationPerAddress(beforeSlot: bigint): Promise<YaciDelegationLatest[]> {
    if (!this.guard()) return [];
    return this.db.query<YaciDelegationLatest[]>(
      `SELECT DISTINCT ON (address) address, drep_hash, drep_type
       FROM delegation_vote
       WHERE slot < $1
       ORDER BY address, slot DESC`,
      [beforeSlot.toString()],
    );
  }

  async getAllDRepRegistrations(): Promise<YaciDrepRegistration[]> {
    if (!this.guard()) return [];
    return this.db.query<YaciDrepRegistration[]>(
      `SELECT DISTINCT ON (drep_hash) tx_hash, cert_index, action_type, drep_hash, drep_type,
              anchor_url, anchor_hash, deposit, slot, epoch, block_time, block_hash
       FROM drep_registration
       ORDER BY drep_hash, slot DESC`,
    );
  }

  async getAllProposals(): Promise<YaciGovActionProposal[]> {
    if (!this.guard()) return [];
    return this.db.query<YaciGovActionProposal[]>(
      `SELECT tx_hash, index, deposit, return_address, type,
              anchor_url, anchor_hash, details, slot, epoch, block_time, block_hash,
              ratified_epoch, enacted_epoch, dropped_epoch, expired_epoch, expiration
       FROM gov_action_proposal
       ORDER BY slot, index`,
    );
  }

  async getVotesSince(sinceSlot: bigint): Promise<YaciVotingProcedure[]> {
    if (!this.guard()) return [];
    return this.db.query<YaciVotingProcedure[]>(
      `SELECT vp.tx_hash, vp.index, vp.voter_hash, vp.voter_type,
              vp.gov_action_tx_hash, vp.gov_action_index, vp.vote,
              vp.anchor_url, vp.anchor_hash, vp.slot, vp.epoch, vp.block_time, vp.block_hash
       FROM voting_procedure vp
       WHERE vp.slot > $1
       ORDER BY vp.slot, vp.index`,
      [sinceSlot.toString()],
    );
  }

  async getLatestSyncedSlot(): Promise<bigint> {
    if (!this.guard()) return 0n;
    const rows = await this.db.query<{ slot: string }[]>(
      `SELECT MAX(slot)::text AS slot FROM block`,
    );
    return rows[0]?.slot ? BigInt(rows[0].slot) : 0n;
  }

  async getHealthStats(): Promise<{
    connected: boolean;
    latestSlot: string;
    tables: Record<string, { count: number; latestSlot?: string }>;
    error?: string;
  }> {
    if (!this.guard()) {
      return { connected: false, latestSlot: '0', tables: {}, error: 'YACI_STORE_DB_* env vars not configured' };
    }
    try {
      const [slot, reg, deleg, prop, votes, stake, epochs] = await Promise.all([
        this.db.query<{ slot: string }[]>('SELECT MAX(slot)::text AS slot FROM block'),
        this.db.query<{ c: string; max_slot: string }[]>('SELECT COUNT(*)::text AS c, MAX(slot)::text AS max_slot FROM drep_registration'),
        this.db.query<{ c: string; max_slot: string }[]>('SELECT COUNT(*)::text AS c, MAX(slot)::text AS max_slot FROM delegation_vote'),
        this.db.query<{ c: string; max_slot: string }[]>('SELECT COUNT(*)::text AS c, MAX(slot)::text AS max_slot FROM gov_action_proposal'),
        this.db.query<{ c: string; max_slot: string }[]>('SELECT COUNT(*)::text AS c, MAX(slot)::text AS max_slot FROM voting_procedure'),
        this.db.query<{ c: string }[]>('SELECT COUNT(*)::text AS c FROM epoch_stake'),
        this.db.query<{ c: string }[]>('SELECT COUNT(*)::text AS c FROM epoch WHERE start_slot IS NOT NULL'),
      ]);
      return {
        connected: true,
        latestSlot: slot[0]?.slot ?? '0',
        tables: {
          drep_registration:   { count: Number(reg[0].c),   latestSlot: reg[0].max_slot },
          delegation_vote:     { count: Number(deleg[0].c), latestSlot: deleg[0].max_slot },
          gov_action_proposal: { count: Number(prop[0].c),  latestSlot: prop[0].max_slot },
          voting_procedure:    { count: Number(votes[0].c), latestSlot: votes[0].max_slot },
          epoch_stake:         { count: Number(stake[0].c) },
          epoch:               { count: Number(epochs[0].c) },
        },
      };
    } catch (e) {
      return { connected: false, latestSlot: '0', tables: {}, error: e.message };
    }
  }
}
