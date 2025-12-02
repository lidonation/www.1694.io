import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovernanceService } from './governance.service';
import { DrepFrontendSnapshot } from '../entities/governance/drep-frontend-snapshot.entity';
import { DrepTimelineEvent } from '../entities/governance/drep-timeline-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [DrepFrontendSnapshot, DrepTimelineEvent], 
      'governance'
    ),
  ],
  providers: [GovernanceService],
  exports: [GovernanceService],
})
export class GovernanceModule {}