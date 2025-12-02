import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { DrepFrontendSnapshot } from '../entities/governance/drep-frontend-snapshot.entity';
import { DrepTimelineEvent } from '../entities/governance/drep-timeline-event.entity';

@Injectable()
export class GovernanceService {
  constructor(
    @InjectDataSource('governance')
    private governanceDataSource: DataSource,
  ) {}

  /**
   * Get paginated DRep list with filtering and sorting
   * This replaces the complex DB-sync queries with optimized governance indexer queries
   */
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
      .getRepository(DrepFrontendSnapshot)
      .createQueryBuilder('drep');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(drep.view ILIKE :search OR drep.givenName ILIKE :search OR drep.chainId ILIKE :search)',
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

    // Apply sorting
    const sortColumn = this.getSortColumn(sort);
    queryBuilder.orderBy(`drep.${sortColumn}`, order);

    // Apply pagination
    const skip = (page - 1) * perPage;
    queryBuilder.skip(skip).take(perPage);

    // Execute query
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

  /**
   * Get DRep timeline events for activity feed
   * This replaces complex joins with simple queries against pre-computed events
   */
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
    const queryBuilder = this.governanceDataSource
      .getRepository(DrepTimelineEvent)
      .createQueryBuilder('event')
      .where('event.drepView = :voterId', { voterId });

    // Apply time range filters
    if (options.startTimeCursor) {
      const startTime = new Date(options.startTimeCursor);
      if (options.loadDirection === 'older') {
        queryBuilder.andWhere('event.timestamp < :startTime', { startTime });
      } else {
        queryBuilder.andWhere('event.timestamp > :startTime', { startTime });
      }
    }

    if (options.endTimeCursor) {
      const endTime = new Date(options.endTimeCursor);
      queryBuilder.andWhere('event.timestamp <= :endTime', { endTime });
    }

    // Apply event type filters
    if (options.filterValues && options.filterValues.length > 0) {
      queryBuilder.andWhere('event.type IN (:...types)', {
        types: options.filterValues,
      });
    }

    // Order and limit
    queryBuilder
      .orderBy('event.timestamp', 'DESC')
      .limit(options.minItems || 20);

    const events = await queryBuilder.getMany();

    return {
      events: events.map(this.formatTimelineEventForAPI),
      hasMore: events.length === (options.minItems || 20),
      cursor: events.length > 0 ? events[events.length - 1].timestamp.getTime() : null,
    };
  }

  /**
   * Get DRep stats (voting power, delegators, etc.)
   */
  async getDRepStats(voterId: string) {
    const drep = await this.governanceDataSource
      .getRepository(DrepFrontendSnapshot)
      .findOne({
        where: { view: voterId },
      });

    if (!drep) {
      return null;
    }

    return {
      votingPower: parseFloat(drep.votingPowerAda),
      liveStake: drep.liveStakeAda ? parseFloat(drep.liveStakeAda) : null,
      delegatorsCount: drep.delegationVoteCount,
      governanceVotesCount: drep.governanceVoteCount,
      isActive: drep.active,
      isRetired: drep.retired,
      isClaimed: drep.isClaimed,
    };
  }

  /**
   * Get single DRep by voter ID
   */
  async getSingleDRep(voterId: string) {
    const drep = await this.governanceDataSource
      .getRepository(DrepFrontendSnapshot)
      .findOne({
        where: { view: voterId },
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

  private formatDRepForAPI(drep: DrepFrontendSnapshot) {
    return {
      drepId: drep.drepHashId,
      view: drep.view,
      chainId: drep.chainId,
      cip129Id: drep.cip129Id,
      hasScript: drep.hasScript,
      type: drep.drepType,
      active: drep.active,
      retired: drep.retired,
      votingPower: parseFloat(drep.votingPowerAda),
      liveStake: drep.liveStakeAda ? parseFloat(drep.liveStakeAda) : null,
      delegatorsCount: drep.delegationVoteCount,
      votesCount: drep.governanceVoteCount,
      givenName: drep.givenName,
      imageUrl: drep.imageUrl,
      metadataUrl: drep.metadataUrl,
      stakeAddress: drep.stakeAddress,
      isClaimed: drep.isClaimed,
      voltaireDrepId: drep.voltaireDrepId,
      updatedAt: drep.updatedAt,
    };
  }

  private formatTimelineEventForAPI(event: DrepTimelineEvent) {
    return {
      id: event.id,
      type: event.type,
      timestamp: event.timestamp.getTime(),
      epochNo: event.epochNo,
      payload: event.payload,
    };
  }
}