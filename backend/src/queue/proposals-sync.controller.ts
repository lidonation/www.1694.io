import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ProposalsSyncService } from './proposals-sync.service';

@Controller('proposals-sync')
export class ProposalsSyncController {
  private readonly logger = new Logger(ProposalsSyncController.name);

  constructor(private readonly proposalsSyncService: ProposalsSyncService) {}

  @Post('trigger')
  async triggerManualSync(@Body() body?: { forceRefresh?: boolean }) {
    this.logger.log('Manual proposals sync requested');
    
    const forceRefresh = body?.forceRefresh || false;
    const result = await this.proposalsSyncService.triggerManualSync(forceRefresh);
    
    this.logger.log(`Manual proposals sync result: ${result.success ? 'success' : 'failure'}`);
    return result;
  }
}