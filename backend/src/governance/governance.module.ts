import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovernanceService } from './governance.service';
import { DrepTimelineEvent } from '../entities/governance/drep-timeline-event.entity';
import { Drep } from '../entities/governance/drep.entity';
import { DrepDelegator } from '../entities/governance/drep-delegator.entity';
import { Proposal } from '../entities/governance/proposal.entity';
import { ProposalMetadata } from '../entities/governance/proposal-metadata.entity';
import { ProposalVote } from '../entities/governance/proposal-vote.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        DrepTimelineEvent,
        Drep,
        DrepDelegator,
        Proposal,
        ProposalMetadata,
        ProposalVote
      ], 
      'default'
    ),
  ],
  providers: [GovernanceService],
  exports: [GovernanceService],
})
export class GovernanceModule {}