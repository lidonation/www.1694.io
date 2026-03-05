import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { Drep } from '../entities/drep.entity';
import { DrepTimelineEvent } from '../entities/drep-timeline-event.entity';

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
    const queryBuilder = this.governanceDataSource
      .getRepository(Drep)
      .createQueryBuilder('drep');

    if (search) {
      queryBuilder.andWhere(
        '(drep.drepId ILIKE :search OR drep.givenName ILIKE :search OR drep.hex ILIKE :search)',
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

    const sortColumn = this.getSortColumn(sort);
    queryBuilder.orderBy(`drep.${sortColumn}`, order);

    const skip = (page - 1) * perPage;
    queryBuilder.skip(skip).take(perPage);

    const [dreps, total] = await queryBuilder.getManyAndCount();

    return {
      data: dreps.map(this.formatDRepForAPI),
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

    const events = await queryBuilder.getMany();

    // Convert events to timeline format
    const timelineEvents = events.map(this.formatTimelineEventForAPI);
    
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
      votingPower: parseFloat(drep.votingPowerAda || '0'),
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

    return sortMap[sort || ''] || 'votingPowerAda';
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
      givenName: drep.givenName,
      given_name: drep.givenName,
      imageUrl: drep.imageUrl,
      metadataUrl: drep.metadataUrl,
      paymentAddress: drep.paymentAddress,
      objectives: drep.objectives,
      motivations: drep.motivations,
      qualifications: drep.qualifications,
      references: drep.references,
      isClaimed: drep.isClaimed,
      voltaireDrepId: drep.voltaireDrepId,
      updatedAt: drep.updatedAt,
    };
  }

  private mapFilterValuesToEventTypes(filterValues: string[]): string[] {
    const mapping = {
      'voting_activity': 'vote',
      'delegation': 'delegation', 
      'registration': 'registration',
      'retirement': 'retirement',
      'proposal': 'proposal'
    };
    
    return filterValues
      .map(filter => mapping[filter] || filter)
      .filter(type => ['vote', 'delegation', 'registration', 'retirement', 'proposal'].includes(type));
  }

  private async getEpochEventsInRange(startTime: Date, endTime: Date): Promise<any[]> {
    // Generate epoch events for the time range
    const epochEvents: any[] = [];
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
      type: mappedType, // Use mapped type for frontend
      timestamp: event.timestamp, // Keep as Date object to match TimelineEntry type
      epoch: event.epoch,
      epochNo: event.epoch, // Keep backward compatibility
      slot: event.slot,
      txHash: event.txHash,
      blockHash: event.blockHash,
      drepId: event.drepId,
      metadata: event.metadata,
      payload: event.metadata, // Keep backward compatibility
      // Add fields expected by frontend for different event types
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