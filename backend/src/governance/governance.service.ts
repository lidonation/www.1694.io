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

    if (!includeRetired) {
      queryBuilder.andWhere('drep.retired = false');
    }

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
    const queryBuilder = this.governanceDataSource
      .getRepository(DrepTimelineEvent)
      .createQueryBuilder('event')
      .where('event.drepId = :voterId', { voterId });

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

    if (options.filterValues && options.filterValues.length > 0) {
      queryBuilder.andWhere('event.eventType IN (:...types)', {
        types: options.filterValues,
      });
    }

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

  private formatTimelineEventForAPI(event: DrepTimelineEvent) {
    return {
      id: event.id,
      eventType: event.eventType,
      type: event.eventType, // Keep backward compatibility
      timestamp: event.timestamp.getTime(),
      epoch: event.epoch,
      epochNo: event.epoch, // Keep backward compatibility
      slot: event.slot,
      txHash: event.txHash,
      blockHash: event.blockHash,
      drepId: event.drepId,
      metadata: event.metadata,
      payload: event.metadata, // Keep backward compatibility
    };
  }
}