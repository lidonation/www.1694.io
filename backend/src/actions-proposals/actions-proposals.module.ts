import { Module } from '@nestjs/common';
import { ActionsProposalsService } from './actions-proposals.service';
import { ActionsProposalsController } from './actions-proposals.controller';

@Module({
  controllers: [ActionsProposalsController],
  providers: [ActionsProposalsService],
})
export class ActionsProposalsModule {}
