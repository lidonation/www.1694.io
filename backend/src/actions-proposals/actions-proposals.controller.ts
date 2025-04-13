import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ActionsProposalsService } from './actions-proposals.service';

@Controller('actions-proposals')
export class ActionsProposalsController {
    constructor(private readonly actionsProposalsService: ActionsProposalsService) {}

    @Get('')
    findAll(
      @Query('page') page: number = 1,
      @Query('pageSize') pageSize: number = 6
    ) {
      return this.actionsProposalsService.findAll(page, pageSize);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.actionsProposalsService.findOne(id);
    }

    @Get(':id/comments')
    findComments(@Param('id') id: string) {
        return this.actionsProposalsService.findComments(id);
    }

    @Post(':id/comments')
    createComment(@Body() commentData: any) {
        return this.actionsProposalsService.createComment(commentData);
    }
}