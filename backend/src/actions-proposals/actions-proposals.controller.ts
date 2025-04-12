import { Controller, Get, Param } from '@nestjs/common';
import { ActionsProposalsService } from './actions-proposals.service';

@Controller('actions-proposals')
export class ActionsProposalsController {
    constructor(private readonly actionsProposalsService: ActionsProposalsService) {}

    @Get('')
    findAll() {
        return this.actionsProposalsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.actionsProposalsService.findOne(id);
    }
}