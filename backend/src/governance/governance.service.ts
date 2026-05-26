import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { Drep } from '../entities/governance/drep.entity';
import { DrepTimelineEvent } from '../entities/governance/drep-timeline-event.entity';
import {
  EpochGroup,
  BundledDelegations,
  StructuredTimelineResponse,
  TimelineEntry,
  TimelineResponse
} from 'src/common/types';

import { ConfigService } from '@nestjs/config';
import { BlockfrostService } from '../blockfrost/blockfrost.service';

@Injectable()
export class GovernanceService {
  private currentEpochCached: number | null = null;
  private lastEpochFetchTime: number = 0;
  private readonly CACHE_DURATION = 3600000; // 1 hour
  private readonly EPOCH_ANCHOR_MS: number;
  private readonly EPOCH_DURATION_MS = 432000000; // 5 days

  constructor(
    @InjectDataSource('default')
    private governanceDataSource: DataSource,
    private configService: ConfigService,
    private blockfrostService: BlockfrostService,
  ) {
    this.EPOCH_ANCHOR_MS = Number(
      this.configService.get<string>('CARDANO_EPOCH_ANCHOR_MS', '1506203091000')
    );
  }

  async getAllDReps(
    search: string = '',
    page: number = 1,
    perPage: number = 24,
    sort?: string,
    order: 'ASC' | 'DESC' = 'DESC',
    onChainStatus?: 'active' | 'inactive',
    campaignStatus?: 'claimed' | 'unclaimed',
    includeRetired: boolean = false,
    type?: 'has_script',
  ) {
    // 1. Build base query for DReps
    const queryBuilder = this.governanceDataSource
      .getRepository(Drep)
      .createQueryBuilder('drep');

    if (search) {
      queryBuilder.andWhere(
        '(drep.drepId ILIKE :search OR drep.metadata->\'json_metadata\'->\'body\'->>\'givenName\' ILIKE :search OR drep.hex ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (onChainStatus === 'active') {
      queryBuilder.andWhere('drep.active = true');
    } else if (onChainStatus === 'inactive') {
      queryBuilder.andWhere('drep.active = false');
    }

    if (campaignStatus === 'claimed') {
      queryBuilder.andWhere('drep.isClaimed = true');
    } else if (campaignStatus === 'unclaimed') {
      queryBuilder.andWhere('drep.isClaimed = false');
    }

    // if (!includeRetired) {
    //   queryBuilder.andWhere('drep.retired = false');
    // }

    if (type === 'has_script') {
      queryBuilder.andWhere('drep.hasScript = true');
    }

    // Fetch all matching DReps (dataset is small ~2k, so this is efficient)
    const allDreps = await queryBuilder.getMany();

    // 2. Fetch raw data for accurate deduplication
    const votesQuery = await this.governanceDataSource
      .query(`SELECT voter, proposal_id FROM proposal_votes`);

    const votesMap = new Map<string, Set<string>>();
    for (const row of votesQuery) {
      if (!votesMap.has(row.voter)) votesMap.set(row.voter, new Set());
      votesMap.get(row.voter).add(row.proposal_id);
    }

    const delegatorsQuery = await this.governanceDataSource
      .query('SELECT drep_id, stake_address, amount_lovelace FROM drep_delegators');

    const delegatorsMap = new Map<string, Set<string>>();

    for (const row of delegatorsQuery) {
      if (!delegatorsMap.has(row.drep_id)) delegatorsMap.set(row.drep_id, new Set());
      delegatorsMap.get(row.drep_id).add(row.stake_address);
    }

    // 3. In-memory Aggregation & Consolidation
    const groups = new Map<string, Drep[]>();

    for (const drep of allDreps) {
      const suffix = drep.hex.length >= 56 ? drep.hex.slice(-56).toLowerCase() : drep.hex.toLowerCase();

      if (!groups.has(suffix)) {
        groups.set(suffix, []);
      }
      groups.get(suffix).push(drep);
    }

    const consolidatedDReps = Array.from(groups.values()).map(group => {
      // Sort group to find primary 
      group.sort((a, b) => b.hex.length - a.hex.length || b.createdAt.getTime() - a.createdAt.getTime());
      const primary = group[0];

      const uniqueDelegators = new Set<string>();
      const uniqueVotes = new Set<string>();

      for (const member of group) {
        // Merge Votes
        const memberVotes = votesMap.get(member.drepId);
        if (memberVotes) {
          for (const vote of memberVotes) uniqueVotes.add(vote);
        }

        // Merge Delegators
        const memberDelegators = delegatorsMap.get(member.drepId);
        if (memberDelegators) {
          for (const del of memberDelegators) uniqueDelegators.add(del);
        }
      }

      // Create virtual consolidated entity
      const consolidated = { ...primary };
      consolidated.delegationVoteCount = uniqueDelegators.size;
      consolidated.governanceVoteCount = uniqueVotes.size;
      consolidated.votingPowerAda = primary.votingPowerAda;

      return consolidated;
    });

    // 4. Sort
    const sortCol = this.getSortColumn(sort);
    consolidatedDReps.sort((a, b) => {
      let valA: any, valB: any;

      if (sortCol === 'delegationVoteCount') {
        valA = a.delegationVoteCount;
        valB = b.delegationVoteCount;
      } else if (sortCol === 'governanceVoteCount') {
        valA = a.governanceVoteCount;
        valB = b.governanceVoteCount;
      } else if (sortCol === 'liveStakeAda' || sortCol === 'votingPowerAda') {
        valA = parseFloat(a.votingPowerAda || '0');
        valB = parseFloat(b.votingPowerAda || '0');
      } else if (sortCol === 'givenName') {
        valA = (a.metadata?.json_metadata?.body?.givenName || '').toLowerCase();
        valB = (b.metadata?.json_metadata?.body?.givenName || '').toLowerCase();
      } else {
        valA = (a as any)[sortCol];
        valB = (b as any)[sortCol];
      }

      if (valA < valB) return order === 'ASC' ? -1 : 1;
      if (valA > valB) return order === 'ASC' ? 1 : -1;
      return 0;
    });

    // 5. Paginate
    const total = consolidatedDReps.length;
    const paginated = consolidatedDReps.slice((page - 1) * perPage, page * perPage);

    return {
      data: paginated.map(this.formatDRepForAPI),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getDRepTimeline(
    voterId: string,
    options: {
      cursor?: string;
      filterValues?: string[];
      minItems?: number;
      loadDirection?: 'older' | 'newer';
    } = {},
  ) {
    const direction = options.loadDirection || 'older';
    const currentEpoch = await this.getCurrentEpoch();
    const epochsPerPage = 4;

    // 1. Determine Epoch Range
    let startEpoch: number;
    let endEpoch: number;

    const rawCursor = options.cursor ? options.cursor.split('_')[0] : '';
    let cursorEpoch = Number(rawCursor);

    // If cursor is a legacy timestamp (e.g. 1700000000000), it's not a valid epoch
    if (isNaN(cursorEpoch) || cursorEpoch > 10000) {
      cursorEpoch = NaN;
    }

    if (!isNaN(cursorEpoch)) {
      if (direction === 'older') {
        endEpoch = cursorEpoch;
        startEpoch = endEpoch - (epochsPerPage - 1);
      } else {
        startEpoch = cursorEpoch;
        endEpoch = startEpoch + (epochsPerPage - 1);
      }
    } else {
      // Initial Load: Show current epoch and 3 previous
      endEpoch = currentEpoch;
      startEpoch = endEpoch - (epochsPerPage - 1);
    }

    if (startEpoch < 0) startEpoch = 0;
    if (endEpoch > currentEpoch) endEpoch = currentEpoch;
    if (endEpoch < startEpoch) endEpoch = startEpoch + (epochsPerPage - 1);

    // 2. Fetch all data for this Epoch Range
    const startTimeStr = this.getEpochStartTime(startEpoch);
    const endTimeStr = this.getEpochEndTime(endEpoch);

    if (!startTimeStr || !endTimeStr) {
      return { epochs: [], nextCursor: null, prevCursor: null, entries: [], appliedStartTime: 0, appliedEndTime: 0 };
    }

    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    const [timelineEntities, rawVotes, rawNotes] = await Promise.all([
      this.fetchTimelineEventsInRange(voterId, startTime, endTime, options.filterValues),
      this.fetchVotesInRange(voterId, startTime, endTime, options.filterValues),
      this.fetchNotesInRange(voterId, startTime, endTime, options.filterValues),
    ]);

    // Batch-load delegator voting power for events missing total_stake in metadata
    const delegationEvents = timelineEntities.entities.filter(
      e => (e.eventType === 'delegation' || e.eventType === 'undelegation') && !e.metadata?.total_stake
    );
    const stakeAddresses = [
      ...new Set(delegationEvents.map(e => e.stakeAddress || e.metadata?.stake_address).filter(Boolean))
    ];
    const stakePowerMap = new Map<string, string>();
    if (stakeAddresses.length > 0) {
      const rows = await this.governanceDataSource.query<{ stake_address: string; amount_lovelace: string; voting_power_lovelace: string }[]>(
        `SELECT stake_address, amount_lovelace, voting_power_lovelace FROM drep_delegators WHERE stake_address = ANY($1)`,
        [stakeAddresses],
      );
      rows.forEach(r => stakePowerMap.set(r.stake_address, r.amount_lovelace || r.voting_power_lovelace));
    }

    // 3. Aggregate all events
    const allEvents: any[] = [];

    timelineEntities.entities.forEach(event => {
      const formatted: any = this.formatTimelineEventForAPI(event, stakePowerMap);
      if (formatted.type === 'voting_activity') {
        const rawData = timelineEntities.raw.find(r => r.event_id === event.id || r.id === event.id);
        if (rawData) {
          formatted.proposal = {
            title: rawData.meta_json_metadata?.body?.title || null,
            abstract: rawData.meta_json_metadata?.body?.abstract || null,
            type: rawData.proposal_governance_type || null,
            submitted_at: rawData.proposal_block_time,
            txHash: rawData.proposal_tx_hash,
          };
          if (rawData.proposal_tx_hash) formatted.txHash = rawData.proposal_tx_hash;
          if (rawData.proposal_anchor_hash) formatted.govActionHash = rawData.proposal_anchor_hash;
          formatted.governance_type = rawData.proposal_governance_type || null;
          formatted.expiration_epoch = rawData.proposal_expiration_epoch != null ? Number(rawData.proposal_expiration_epoch) : null;
          formatted.ratified_epoch   = rawData.proposal_ratified_epoch   != null ? Number(rawData.proposal_ratified_epoch)   : null;
          formatted.enacted_epoch    = rawData.proposal_enacted_epoch    != null ? Number(rawData.proposal_enacted_epoch)    : null;
          formatted.dropped_epoch    = rawData.proposal_dropped_epoch    != null ? Number(rawData.proposal_dropped_epoch)    : null;
          formatted.expired_epoch    = rawData.proposal_expired_epoch    != null ? Number(rawData.proposal_expired_epoch)    : null;
        }
      }
      allEvents.push(formatted);
    });

    const seenTxHashes = new Set(allEvents.filter(e => e.txHash).map(e => e.txHash));
    rawVotes.forEach(vote => {
      if (!seenTxHashes.has(vote.tx_hash)) {
        const epoch = this.getEpochNo(new Date(vote.block_time).getTime());
        allEvents.push({
          id: `vote-${vote.id}`,
          type: 'voting_activity',
          eventType: 'vote',
          timestamp: vote.block_time,
          epoch,
          epochNo: epoch,
          txHash: vote.proposal_tx_hash || vote.tx_hash,
          govActionHash: vote.proposal_anchor_hash,
          vote: vote.vote.charAt(0).toUpperCase() + vote.vote.slice(1).toLowerCase(),
          gov_action_proposal_id: vote.proposal_id,
          time_voted: vote.block_time,
          governance_type: vote.governance_type || null,
          expiration_epoch: vote.expiration_epoch != null ? Number(vote.expiration_epoch) : null,
          ratified_epoch:   vote.ratified_epoch   != null ? Number(vote.ratified_epoch)   : null,
          enacted_epoch:    vote.enacted_epoch    != null ? Number(vote.enacted_epoch)    : null,
          dropped_epoch:    vote.dropped_epoch    != null ? Number(vote.dropped_epoch)    : null,
          expired_epoch:    vote.expired_epoch    != null ? Number(vote.expired_epoch)    : null,
          proposal: { title: vote.title, abstract: vote.abstract, type: vote.governance_type, submitted_at: vote.block_time }
        });
      }
    });

    rawNotes.forEach(note => {
      const timestamp = note.updatedAt || note.createdAt;
      const epoch = this.getEpochNo(new Date(timestamp).getTime());
      allEvents.push({
        id: `note-${note.id}`,
        type: 'note',
        eventType: 'note',
        timestamp,
        epoch,
        epochNo: epoch,
        title: note.title,
        content: note.content,
        tag: note.tag,
      });
    });

    // 4. Batch-enrich voting_activity events with DRep/CC vote counts and stakes
    const voteEvents = allEvents.filter(e => e.type === 'voting_activity');
    if (voteEvents.length > 0) {
      const proposalIds = [...new Set(voteEvents.map(e => e.gov_action_proposal_id).filter(Boolean))];
      if (proposalIds.length > 0) {
        const voteCountRows = await this.governanceDataSource.query<{
          proposal_id: string;
          drep_yes_count: string; drep_no_count: string; drep_abstain_count: string;
          drep_yes_stake: string; drep_no_stake: string; drep_abstain_stake: string;
          drep_total_active_stake: string;
          cc_yes_count: string; cc_no_count: string; cc_abstain_count: string;
        }[]>(
          `SELECT
            pv.proposal_id,
            COUNT(*) FILTER (WHERE LOWER(pv.voter_role) = 'drep' AND LOWER(pv.vote) = 'yes')     AS drep_yes_count,
            COUNT(*) FILTER (WHERE LOWER(pv.voter_role) = 'drep' AND LOWER(pv.vote) = 'no')      AS drep_no_count,
            COUNT(*) FILTER (WHERE LOWER(pv.voter_role) = 'drep' AND LOWER(pv.vote) = 'abstain') AS drep_abstain_count,
            COALESCE(SUM(d.voting_power_ada::numeric) FILTER (WHERE LOWER(pv.voter_role) = 'drep' AND LOWER(pv.vote) = 'yes'),     0) AS drep_yes_stake,
            COALESCE(SUM(d.voting_power_ada::numeric) FILTER (WHERE LOWER(pv.voter_role) = 'drep' AND LOWER(pv.vote) = 'no'),      0) AS drep_no_stake,
            COALESCE(SUM(d.voting_power_ada::numeric) FILTER (WHERE LOWER(pv.voter_role) = 'drep' AND LOWER(pv.vote) = 'abstain'), 0) AS drep_abstain_stake,
            COALESCE((
              SELECT SUM(des.amount_lovelace) / 1000000.0
              FROM drep_epoch_stake des
              JOIN proposals p ON p.id = pv.proposal_id
              WHERE des.active = true
                AND des.drep_id != 'drep_always_abstain'
                AND des.epoch_no = (
                  SELECT MAX(epoch_no) FROM drep_epoch_stake
                  WHERE epoch_no <= COALESCE(p.expiration_epoch, 9999)
                )
            ), 0) AS drep_total_active_stake,
            COUNT(*) FILTER (WHERE LOWER(pv.voter_role) = 'constitutional_committee' AND LOWER(pv.vote) = 'yes')     AS cc_yes_count,
            COUNT(*) FILTER (WHERE LOWER(pv.voter_role) = 'constitutional_committee' AND LOWER(pv.vote) = 'no')      AS cc_no_count,
            COUNT(*) FILTER (WHERE LOWER(pv.voter_role) = 'constitutional_committee' AND LOWER(pv.vote) = 'abstain') AS cc_abstain_count
           FROM proposal_votes pv
           LEFT JOIN dreps d ON d.drep_id = pv.voter
           WHERE pv.proposal_id = ANY($1)
           GROUP BY pv.proposal_id`,
          [proposalIds],
        );
        const vcMap = new Map(voteCountRows.map(r => [r.proposal_id, r]));
        voteEvents.forEach(ev => {
          const vc = vcMap.get(ev.gov_action_proposal_id);
          if (vc) {
            ev.drep_yes_count       = Number(vc.drep_yes_count);
            ev.drep_no_count        = Number(vc.drep_no_count);
            ev.drep_abstain_count   = Number(vc.drep_abstain_count);
            ev.drep_yes_stake       = Number(vc.drep_yes_stake);
            ev.drep_no_stake        = Number(vc.drep_no_stake);
            ev.drep_abstain_stake   = Number(vc.drep_abstain_stake);
            ev.drep_total_active_stake = Number(vc.drep_total_active_stake);
            ev.cc_yes_count         = Number(vc.cc_yes_count);
            ev.cc_no_count          = Number(vc.cc_no_count);
            ev.cc_abstain_count     = Number(vc.cc_abstain_count);
          }
        });
      }
    }

    // 5. Group EVERY Epoch in range (DESC)
    const epochGroups: EpochGroup[] = [];
    for (let e = endEpoch; e >= startEpoch; e--) {
      const epochEvents = allEvents.filter(ev => ev.epochNo === e);
      // Sort events within epoch (DESC)
      epochEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() || b.id.localeCompare(a.id));

      const rawItems = [];
      let currentBundle: BundledDelegations | null = null;

      for (const ev of epochEvents) {
        if (ev.type === 'delegation' || ev.type === 'undelegation') {
          if (!currentBundle || currentBundle.bundleType !== ev.type) {
            currentBundle = {
              type: 'bundled_delegations',
              bundleType: ev.type,
              id: `bundle-${ev.type}-e${e}-${ev.id}`,
              timestamp: ev.timestamp,
              items: [ev],
              epochNo: e,
            };
            rawItems.push(currentBundle);
          } else {
            currentBundle.items.push(ev);
          }
        } else {
          currentBundle = null;
          rawItems.push(ev);
        }
      }

      // Expand single-item bundles back to standalone events
      const items = rawItems.flatMap(item =>
        item.type === 'bundled_delegations' && item.items.length === 1
          ? [item.items[0]]
          : [item],
      );

      epochGroups.push({
        epochNo: e,
        startTime: this.getEpochStartTime(e),
        endTime: this.getEpochEndTime(e),
        items,
      });
    }

    return {
      epochs: direction === 'newer' ? [...epochGroups].reverse() : epochGroups,
      nextCursor: startEpoch > 0 ? `${startEpoch - 1}_older` : null,
      prevCursor: endEpoch < currentEpoch ? `${endEpoch + 1}_newer` : null,
      appliedStartTime: startTime.getTime(),
      appliedEndTime: endTime.getTime(),
      entries: [],
    };
  }

  private async fetchTimelineEventsInRange(voterId: string, startTime: Date, endTime: Date, filterValues?: string[]) {
    const queryBuilder = this.governanceDataSource
      .getRepository(DrepTimelineEvent)
      .createQueryBuilder('event')
      .addSelect('event.id', 'event_id')
      .leftJoin('proposals', 'proposal', "(proposal.tx_hash = event.metadata->>'gov_action_proposal_id' OR proposal.tx_hash = event.txHash OR proposal.id = event.metadata->>'gov_action_proposal_id') AND proposal.cert_index = COALESCE((event.metadata->>'proposal_index')::int, 0)")
      .leftJoin('proposal_metadata', 'meta', 'meta.proposal_id = proposal.id')
      .addSelect('proposal.tx_hash', 'proposal_tx_hash')
      .addSelect('proposal.governance_type', 'proposal_governance_type')
      .addSelect('proposal.expiration_epoch', 'proposal_expiration_epoch')
      .addSelect('proposal.ratified_epoch', 'proposal_ratified_epoch')
      .addSelect('proposal.enacted_epoch', 'proposal_enacted_epoch')
      .addSelect('proposal.dropped_epoch', 'proposal_dropped_epoch')
      .addSelect('proposal.expired_epoch', 'proposal_expired_epoch')
      .addSelect('meta.hash', 'proposal_anchor_hash')
      .addSelect('meta.json_metadata', 'meta_json_metadata')
      .where('event.drepId = :voterId', { voterId })
      .andWhere('event.timestamp >= :startTime AND event.timestamp < :endTime', { startTime, endTime });

    if (filterValues && filterValues.length > 0) {
      const types = this.mapFilterValuesToEventTypes(filterValues);
      if (types.length > 0) queryBuilder.andWhere('event.eventType IN (:...types)', { types });
    }

    return await queryBuilder.getRawAndEntities();
  }

  private async fetchVotesInRange(voterId: string, startTime: Date, endTime: Date, filterValues?: string[]) {
    if (filterValues && filterValues.length > 0 && !filterValues.includes('voting_activity')) return [];
    const query = `
        SELECT v.*, p.governance_type, p.tx_hash as proposal_tx_hash, p.expiration_epoch, p.ratified_epoch, p.enacted_epoch, p.dropped_epoch, p.expired_epoch, m.hash as proposal_anchor_hash, m.json_metadata->'body'->>'title' as title, m.json_metadata->'body'->>'abstract' as abstract
        FROM proposal_votes v
        LEFT JOIN proposals p ON p.id = v.proposal_id
        LEFT JOIN proposal_metadata m ON p.id = m.proposal_id
        WHERE v.voter = $1 AND v.block_time >= $2 AND v.block_time < $3
    `;
    return await this.governanceDataSource.query(query, [voterId, startTime, endTime]);
  }

  private async fetchNotesInRange(voterId: string, startTime: Date, endTime: Date, filterValues?: string[]) {
    if (filterValues && filterValues.length > 0 && !filterValues.includes('note')) return [];
    const query = `
        SELECT n.* FROM note n
        LEFT JOIN signature s ON s."drepId" = n."drepId"
        WHERE (s.drep_bech32 = $1 OR s."voterId" = $1) AND n.\"updatedAt\" >= $2 AND n.\"updatedAt\" < $3
    `;
    return await this.governanceDataSource.query(query, [voterId, startTime, endTime]);
  }

  private getEpochNo(timestamp: number): number {
    return Math.floor((timestamp - this.EPOCH_ANCHOR_MS) / this.EPOCH_DURATION_MS);
  }

  // Absolute Epoch Boundary Helpers
  private getEpochStartTime(epoch: number): string | null {
    try {
      return new Date(this.EPOCH_ANCHOR_MS + (epoch * this.EPOCH_DURATION_MS)).toISOString();
    } catch (e) {
      return null;
    }
  }

  private getEpochEndTime(epoch: number): string | null {
    try {
      return new Date(this.EPOCH_ANCHOR_MS + ((epoch + 1) * this.EPOCH_DURATION_MS)).toISOString();
    } catch (e) {
      return null;
    }
  }

  async getDRepStats(voterId: string) {
    const drep = await this.governanceDataSource
      .getRepository(Drep)
      .findOne({
        where: { drepId: voterId },
      });

    if (!drep) {
      return null;
    }

    return {
      votingPower: parseFloat(drep.votingPowerAda),
      liveStake: drep.votingPowerAda ? parseFloat(drep.votingPowerAda) : null,
      delegatorsCount: drep.delegationVoteCount,
      governanceVotesCount: drep.governanceVoteCount,
      isActive: drep.active,
      isRetired: drep.retired,
      isClaimed: drep.isClaimed,
    };
  }

  async getSingleDRep(voterId: string) {
    const drep = await this.governanceDataSource
      .getRepository(Drep)
      .findOne({
        where: { drepId: voterId },
      });

    return drep ? this.formatDRepForAPI(drep) : null;
  }

  private getSortColumn(sort?: string): string {
    const sortMap = {
      votingPower: 'votingPowerAda',
      liveStake: 'liveStakeAda',
      delegators: 'delegationVoteCount',
      votes: 'governanceVoteCount',
      name: 'givenName',
      updated: 'updatedAt',
    };

    return sortMap[sort] || 'votingPowerAda';
  }

  private formatDRepForAPI(drep: Drep) {
    return {
      drepId: drep.drepId,
      view: drep.drepId,
      chainId: drep.hex,
      cip129Id: drep.drepId,
      hasScript: drep.hasScript,
      type: drep.hasScript ? 'scripted' : 'drep',
      active: drep.active,
      retired: drep.retired,
      votingPower: drep.votingPowerAda ? parseFloat(drep.votingPowerAda) : 0,
      voting_power: drep.votingPowerAda ? parseFloat(drep.votingPowerAda) : 0,
      liveStake: drep.votingPowerAda ? parseFloat(drep.votingPowerAda) : null,
      live_stake: drep.votingPowerAda ? parseFloat(drep.votingPowerAda) : null,
      delegatorsCount: drep.delegationVoteCount,
      delegation_vote_count: drep.delegationVoteCount,
      votesCount: drep.governanceVoteCount,
      governance_vote_count: drep.governanceVoteCount,
      metadata: drep.metadata,
      givenName: drep.metadata?.json_metadata?.body?.givenName || null,
      given_name: drep.metadata?.json_metadata?.body?.givenName || null,
      imageUrl: drep.metadata?.json_metadata?.body?.image?.contentUrl || null,
      metadataUrl: drep.metadata?.url || null,
      paymentAddress: drep.metadata?.json_metadata?.body?.paymentAddress || null,
      objectives: drep.metadata?.json_metadata?.body?.objectives || null,
      motivations: drep.metadata?.json_metadata?.body?.motivations || null,
      qualifications: drep.metadata?.json_metadata?.body?.qualifications || null,
      references: drep.metadata?.json_metadata?.body?.references || null,
      isClaimed: drep.isClaimed,
      voltaireDrepId: drep.voltaireDrepId,
      updatedAt: drep.updatedAt,
      format: drep.hex.length === 58 ? 'cip129' : 'legacy',
    };
  }

  private mapFilterValuesToEventTypes(filterValues: string[] | string): string[] {
    const mapping = {
      'voting_activity': 'vote',
      'delegation': 'delegation',
      'registration': 'registration',
      'retirement': 'retirement',
      'proposal': 'proposal'
    };

    const values = Array.isArray(filterValues) ? filterValues : [filterValues];

    return values
      .map(filter => mapping[filter] || filter)
      .filter(type => ['vote', 'delegation', 'undelegation', 'registration', 'retirement', 'proposal'].includes(type));
  }

  private async getEpochEventsInRange(startTime: Date, endTime: Date): Promise<any[]> {
    const epochEvents = [];
    const startEpoch = Math.floor((startTime.getTime() - this.EPOCH_ANCHOR_MS) / this.EPOCH_DURATION_MS);
    const endEpoch = Math.floor((endTime.getTime() - this.EPOCH_ANCHOR_MS) / this.EPOCH_DURATION_MS);

    for (let epoch = Math.max(startEpoch, 0); epoch <= endEpoch; epoch++) {
      const epochStartTime = this.EPOCH_ANCHOR_MS + (epoch * this.EPOCH_DURATION_MS);
      if (epochStartTime >= startTime.getTime() && epochStartTime < endTime.getTime()) {
        epochEvents.push({
          id: `epoch-${epoch}`,
          type: 'epoch',
          timestamp: new Date(epochStartTime),
          no: epoch,
          epochNo: epoch,
          start_time: new Date(epochStartTime).toISOString(),
          end_time: new Date(epochStartTime + this.EPOCH_DURATION_MS).toISOString()
        });
      }
    }

    return epochEvents;
  }

  private formatTimelineEventForAPI(event: DrepTimelineEvent, stakePowerMap?: Map<string, string>) {
    // Map database event types to frontend expected types
    const typeMapping = {
      'vote': 'voting_activity',
      'delegation': 'delegation',
      'registration': 'registration',
      'retirement': 'retirement',
      'proposal': 'proposal'
    };

    const mappedType = typeMapping[event.eventType] || event.eventType;

    return {
      id: event.id,
      eventType: event.eventType,
      type: mappedType,
      timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp,
      epoch: event.epoch,
      epochNo: event.epoch,
      slot: event.slot,
      txHash: event.txHash,
      blockHash: event.blockHash,
      drepId: event.drepId,
      metadata: event.metadata,
      payload: event.metadata,
      ...(mappedType === 'delegation' && event.metadata ? {
        stake_address: event.stakeAddress || event.metadata.stake_address,
        current_drep: event.metadata.current_drep,
        previous_drep: event.previousDrep || event.metadata.previous_drep,
        total_stake: event.metadata.total_stake || stakePowerMap?.get(event.stakeAddress || event.metadata.stake_address) || '0',
        added_power: event.metadata.added_power ?? true,
        delegation_epoch: event.epoch,
        tx_hash: event.txHash
      } : {}),
      ...(mappedType === 'voting_activity' && event.metadata ? {
        vote: event.metadata.vote ? event.metadata.vote.charAt(0).toUpperCase() + event.metadata.vote.slice(1).toLowerCase() : null,
        gov_action_proposal_id: event.metadata.gov_action_proposal_id,
        txHash: event.metadata.proposal_tx_hash || event.txHash,
        govActionHash: event.metadata.govActionHash || event.metadata.proposal_anchor_hash,
        time_voted: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp,
        voting_epoch: event.epoch,
        url: event.metadata.url,
        vote_rationale: event.metadata.vote_rationale
      } : {}),
      ...(mappedType === 'undelegation' && event.metadata ? {
        stake_address: event.metadata.stake_address,
        current_drep: event.metadata.target_drep || event.metadata.current_drep,
        previous_drep: event.drepId,
        total_stake: event.metadata.total_stake || stakePowerMap?.get(event.metadata.stake_address) || '0',
        added_power: false,
        delegation_epoch: event.epoch,
        tx_hash: event.txHash
      } : {})
    };
  }

  private async getCurrentEpoch(): Promise<number> {
    const now = Date.now();
    if (this.currentEpochCached && (now - this.lastEpochFetchTime) < this.CACHE_DURATION) {
      return this.currentEpochCached;
    }

    try {
      const latestBlock = await this.blockfrostService.getLatestBlock();
      if (latestBlock && latestBlock.epoch !== undefined) {
        this.currentEpochCached = latestBlock.epoch;
        this.lastEpochFetchTime = now;
        return this.currentEpochCached;
      }
    } catch (error) {
      console.warn('Failed to fetch latest epoch from Blockfrost, using fallback:', error);
    }

    // Fallback based on Mainnet anchor if Blockfrost fails
    return this.getEpochNo(now);
  }
}