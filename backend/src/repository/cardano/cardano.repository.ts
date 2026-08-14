import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { VotingActivityHistory } from 'src/common/types';
import { Drep } from 'src/entities/governance/drep.entity';
import { DrepTimelineEvent } from 'src/entities/governance/drep-timeline-event.entity';
import { DrepDelegator } from 'src/entities/governance/drep-delegator.entity';
import { ProposalVote } from 'src/entities/governance/proposal-vote.entity';
import { Proposal } from 'src/entities/governance/proposal.entity';

@Injectable()
export class CardanoRepository {
  constructor(
    @InjectDataSource('default')
    private readonly dataSource: DataSource,
  ) {}

  async query(queryString: string, params?: any[]): Promise<any> {
    return this.dataSource.query(queryString, params);
  }

  async getCurrentDelegation(stakeKey: string) {
    const delegation = await this.dataSource
      .getRepository(DrepDelegator)
      .createQueryBuilder('delegator')
      .innerJoin(Drep, 'drep', 'drep.drepId = delegator.drepId')
      .select([
        'delegator.drepId as drep_id',
        'delegator.stakeAddress as stake_address',
        'delegator.amountLovelace as amount',
        'delegator.votingPowerLovelace as voting_power',
        'drep.drepId as drep_view',
        'drep.active as active',
      ])
      .where('delegator.stakeAddress = :stakeKey', { stakeKey })
      .andWhere('drep.active = true')
      .getRawMany();

    return delegation;
  }

  async getDrepVotingActivity(
    drepView: string,
    startTime: Date,
    endTime: Date,
  ): Promise<VotingActivityHistory[]> {
    const events = await this.dataSource
      .getRepository(DrepTimelineEvent)
      .createQueryBuilder('event')
      .where('event.drepId = :drepView', { drepView })
      .andWhere('event.timestamp >= :startTime', { startTime })
      .andWhere('event.timestamp <= :endTime', { endTime })
      .andWhere('event.eventType = :eventType', { eventType: 'vote' })
      .orderBy('event.timestamp', 'DESC')
      .getMany();

    return events.map((event) => ({
      view: drepView,
      gov_action_proposal_id:
        event.metadata?.gov_action_proposal_id ||
        event.metadata?.proposalId ||
        'unknown',
      prop_inception: event.timestamp,
      type: 'voting_activity',
      description: event.metadata?.description || 'Voting activity',
      voting_anchor_id: event.metadata?.voting_anchor_id || 'unknown',
      vote: event.metadata?.vote || 'unknown',
      metadata: event.metadata || {},
      time_voted: event.timestamp,
      proposal_epoch: event.epoch,
      voting_epoch: event.epoch,
      url: event.metadata?.url || null,
    }));
  }

  async getDrepByView(drepId: string) {
    const drep = await this.dataSource.getRepository(Drep).findOne({
      where: { drepId },
    });

    if (!drep) {
      return [];
    }

    return [
      {
        id: drep.voltaireDrepId || 0,
        view: drep.drepId,
      },
    ];
  }

  async getDrepDelegators(drepHashId: number) {
    const drep = await this.dataSource.getRepository(Drep).findOne({
      where: { voltaireDrepId: drepHashId },
      select: ['drepId'],
    });

    if (!drep) {
      return [];
    }

    const delegators = await this.dataSource
      .getRepository(DrepDelegator)
      .createQueryBuilder('delegator')
      .select('delegator.stakeAddress as view')
      .where('delegator.drepId = :drepId', { drepId: drep.drepId })
      .getRawMany();

    return delegators;
  }
}
