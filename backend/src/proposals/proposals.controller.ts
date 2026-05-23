import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProposalsService } from './proposals.service';

@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get('')
  getProposalByQuery(@Query('query') query: string) {
    return this.proposalsService.getProposalByQuery(query);
  }

  @Get(':id')
  getProposalById(@Param('id') id: string) {
    return this.proposalsService.getProposalById(id);
  }
}
