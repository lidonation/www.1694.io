import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovernanceService } from './governance.service';
import { GovernanceMigrationService } from './governance-migration.service';
import { DrepTimelineEvent } from '../entities/governance/drep-timeline-event.entity';
import { Drep } from '../entities/governance/drep.entity';
import { DrepDelegator } from '../entities/governance/drep-delegator.entity';
import { Proposal } from '../entities/governance/proposal.entity';
import { ProposalMetadata } from '../entities/governance/proposal-metadata.entity';
import { ProposalVote } from '../entities/governance/proposal-vote.entity';
import { SyncState } from '../entities/sync-state.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        DrepTimelineEvent,
        Drep,
        DrepDelegator,
        Proposal,
        ProposalMetadata,
        ProposalVote,
        SyncState
      ], 
      'default'
    ),
  ],
  providers: [GovernanceService, GovernanceMigrationService],
  exports: [GovernanceService, GovernanceMigrationService],
})
export class GovernanceModule {}