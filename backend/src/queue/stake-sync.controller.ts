import { Controller, Get, Param, Post } from '@nestjs/common';
import { StakeSyncService } from './stake-sync.service';
import { BlockfrostService } from '../blockfrost/blockfrost.service';

@Controller('admin/stake-sync')
export class StakeSyncController {
  constructor(
    private readonly stakeSyncService: StakeSyncService,
    private readonly blockfrostService: BlockfrostService
  ) {}

  @Post('trigger')
  async triggerManualStakeSync() {
    return this.stakeSyncService.triggerManualStakeSync();
  }

  @Get('test/:drepId')
  async testBlockfrost(@Param('drepId') drepId: string) {
    try {
      const drepInfo = await this.blockfrostService.getDRepInfo(drepId);
      return {
        success: true,
        data: drepInfo
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
