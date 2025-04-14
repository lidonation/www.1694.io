import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ActionsProposalsService } from './actions-proposals.service';

@Controller('actions-proposals')
export class ActionsProposalsController {
    constructor(private readonly actionsProposalsService: ActionsProposalsService) {}

    @Get('')
    findAll(
      @Query('page') page: number = 1,
      @Query('pageSize') pageSize: number = 12,
      @Query('search') search?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
      @Query('category') category?: string | string[],
    ) {
      const normalizedCategory = Array.isArray(category) ? category.join(',') : category;

      return this.actionsProposalsService.findAll({
        page,
        pageSize,
        search,
        sortBy,
        sortOrder,
        category: normalizedCategory,
      });
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
    createComment(@Body() commentData: any, @Headers('authorization') authorization: string) {
        return this.actionsProposalsService.createComment(commentData, authorization);
    }
}