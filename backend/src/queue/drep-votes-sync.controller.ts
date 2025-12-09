import { Body, Controller, Post } from '@nestjs/common';
import { DrepVotesSyncService } from './drep-votes-sync.service';

@Controller('drep-votes-sync')
export class DrepVotesSyncController {
  constructor(private readonly drepVotesSyncService: DrepVotesSyncService) {}

  @Post('trigger')
  trigger(@Body() body?: { forceRefresh?: boolean }) {
    const forceRefresh = body?.forceRefresh ?? false;
    return this.drepVotesSyncService.triggerManualDrepVotesSync(forceRefresh);
  }
}
