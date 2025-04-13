import { Module } from '@nestjs/common';
import { ActionsProposalsService } from './actions-proposals.service';
import { ActionsProposalsController } from './actions-proposals.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule],
    controllers: [ActionsProposalsController],
    providers: [ActionsProposalsService],
})
export class ActionsProposalsModule {}