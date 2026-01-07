import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { Drep } from '../entities/governance/drep.entity';
import { DrepTimelineEvent } from '../entities/governance/drep-timeline-event.entity';

@Injectable()
export class GovernanceService {
  constructor(
    @InjectDataSource('default')
    private governanceDataSource: DataSource,
  ) {}

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

    if (!includeRetired) {
      queryBuilder.andWhere('drep.retired = false');
    }

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
      startTimeCursor?: number;
      endTimeCursor?: number;
      filterValues?: string[];
      minItems?: number;
      loadDirection?: 'older' | 'newer';
    } = {},
  ) {
    const startTime = options.startTimeCursor ? new Date(options.startTimeCursor) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const endTime = options.endTimeCursor ? new Date(options.endTimeCursor) : new Date();
    
    // Build query for timeline events
    const queryBuilder = this.governanceDataSource
      .getRepository(DrepTimelineEvent)
      .createQueryBuilder('event')
      .leftJoin('proposals', 'proposal', "proposal.tx_hash = event.metadata->>'gov_action_proposal_id' AND proposal.cert_index = (event.metadata->>'proposal_index')::int")
      .leftJoin('proposal_metadata', 'meta', 'meta.proposal_id = proposal.id')
      .addSelect(['proposal.governanceType', 'meta.jsonMetadata'])
      .where('event.drepId = :voterId', { voterId });

    if (options.loadDirection === 'older') {
      queryBuilder.andWhere('event.timestamp < :endTime', { endTime });
    } else {
      queryBuilder.andWhere('event.timestamp > :startTime', { startTime });
    }
    
    queryBuilder.andWhere('event.timestamp >= :startTime', { startTime });
    queryBuilder.andWhere('event.timestamp <= :endTime', { endTime });

    // Map frontend filter values to database event types
    if (options.filterValues && options.filterValues.length > 0) {
      const mappedTypes = this.mapFilterValuesToEventTypes(options.filterValues);
      if (mappedTypes.length > 0) {
        queryBuilder.andWhere('event.eventType IN (:...types)', { types: mappedTypes });
      }
    }

    queryBuilder
      .orderBy('event.timestamp', 'DESC')
      .limit(options.minItems || 20);

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    // Convert events to timeline format
    const timelineEvents = entities.map((event) => {
      const formatted = this.formatTimelineEventForAPI(event);
      
      let proposal = null;

      // Inject proposal metadata for voting events
      if (formatted.type === 'voting_activity') {
        const rawData = raw.find(r => r.event_id === event.id);
        if (rawData) {
          proposal = {
            title: rawData.meta_json_metadata?.body?.title || null,
            abstract: rawData.meta_json_metadata?.body?.abstract || null,
            rationale: rawData.meta_json_metadata?.body?.rationale || null,
            type: rawData.proposal_governance_type || null
          };
        }
      }
      return {
        ...formatted,
        proposal
      };
    });
    
    // Add epoch markers if not filtering for specific types or if epochs are requested
    const shouldIncludeEpochs = !options.filterValues || 
      options.filterValues.length === 0 || 
      options.filterValues.includes('epoch');
      
    if (shouldIncludeEpochs) {
      const epochEvents = await this.getEpochEventsInRange(startTime, endTime);
      timelineEvents.push(...epochEvents);
    }

    // Sort all events by timestamp descending
    timelineEvents.sort((a, b) => {
      const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      return bTime - aTime;
    });
    
    // Limit to requested number of items
    const limitedEvents = timelineEvents.slice(0, options.minItems || 20);

    return {
      events: limitedEvents,
      hasMore: limitedEvents.length === (options.minItems || 20),
      cursor: limitedEvents.length > 0 ? 
        (limitedEvents[limitedEvents.length - 1].timestamp instanceof Date ? 
         limitedEvents[limitedEvents.length - 1].timestamp.getTime() : 
         new Date(limitedEvents[limitedEvents.length - 1].timestamp).getTime()) : null,
    };
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
      .filter(type => ['vote', 'delegation', 'registration', 'retirement', 'proposal'].includes(type));
  }

  private async getEpochEventsInRange(startTime: Date, endTime: Date): Promise<any[]> {
    // Generate epoch events for the time range
    const epochEvents = [];
    const startEpoch = Math.floor((startTime.getTime() - 1506203091000) / (5 * 24 * 60 * 60 * 1000)); // Rough epoch calculation
    const endEpoch = Math.floor((endTime.getTime() - 1506203091000) / (5 * 24 * 60 * 60 * 1000));
    
    for (let epoch = Math.max(startEpoch, 0); epoch <= endEpoch; epoch++) {
      const epochStartTime = 1506203091000 + (epoch * 5 * 24 * 60 * 60 * 1000);
      if (epochStartTime >= startTime.getTime() && epochStartTime <= endTime.getTime()) {
        epochEvents.push({
          type: 'epoch',
          timestamp: new Date(epochStartTime), // Convert to Date object to match TimelineEntry type
          no: epoch,
          epochNo: epoch,
          start_time: new Date(epochStartTime).toISOString(),
          end_time: new Date(epochStartTime + (5 * 24 * 60 * 60 * 1000)).toISOString()
        });
      }
    }
    
    return epochEvents;
  }

  private formatTimelineEventForAPI(event: DrepTimelineEvent) {
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
      timestamp: event.timestamp, 
      epoch: event.epoch,
      epochNo: event.epoch, 
      slot: event.slot,
      txHash: event.txHash,
      blockHash: event.blockHash,
      drepId: event.drepId,
      metadata: event.metadata,
      payload: event.metadata, 
      ...(mappedType === 'delegation' && event.metadata ? {
        stake_address: event.metadata.stake_address,
        current_drep: event.metadata.current_drep,
        previous_drep: event.metadata.previous_drep,
        total_stake: event.metadata.total_stake,
        added_power: event.metadata.added_power,
        delegation_epoch: event.epoch,
        tx_hash: event.txHash
      } : {}),
      ...(mappedType === 'voting_activity' && event.metadata ? {
        vote: event.metadata.vote,
        gov_action_proposal_id: event.metadata.gov_action_proposal_id,
        time_voted: event.timestamp,
        voting_epoch: event.epoch,
        url: event.metadata.url,
        vote_rationale: event.metadata.vote_rationale
      } : {})
    };
  }
}