import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ActionsProposalsService } from './actions-proposals.service';

@Controller('actions-proposals')
export class ActionsProposalsController {
  constructor(
    private readonly actionsProposalsService: ActionsProposalsService,
  ) {}
  @Get('')
  findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 12,
    @Query('s') search: string = '',
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
    @Query('category') category?: string,
    @Query('committee') committee?: string,
  ) {
    return this.actionsProposalsService.findAll({
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
      category: category ? category.split(',') : [],
      committee: committee ? committee.split(',') : [],
    });
  }

  @Get('freshness')
  getFreshness(@Query('thresholdDays') thresholdDays?: string) {
    const parsed = thresholdDays ? Number(thresholdDays) : 90;
    const days =
      Number.isFinite(parsed) && parsed > 0
        ? Math.min(Math.floor(parsed), 3650)
        : 90;
    return this.actionsProposalsService.getDatasetFreshness(days);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actionsProposalsService.findOne(id);
  }

  @Get(':id/comments')
  findComments(@Param('id') id: string) {
    return this.actionsProposalsService.findComments(id);
  }

  @Get(':id/polls')
  findPoll(@Param('id') id: string) {
    return this.actionsProposalsService.findPoll(id);
  }

  @Post(':id/comments')
  createComment(
    @Body() commentData: any,
    @Headers('authorization') authorization: string,
  ) {
    return this.actionsProposalsService.createComment(
      commentData,
      authorization,
    );
  }

  @Post('/poll/votes')
  createVote(
    @Body() voteData: any,
    @Headers('authorization') authorization: string,
  ) {
    return this.actionsProposalsService.createVote(voteData, authorization);
  }
}
