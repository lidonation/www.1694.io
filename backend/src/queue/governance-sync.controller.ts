import { Controller, Post, Body, Get } from '@nestjs/common';
import { GovernanceSyncService } from './governance-sync.service';
import { GovernanceMigrationService } from '../governance/governance-migration.service';

@Controller('governance-sync')
export class GovernanceSyncController {
  constructor(
    private readonly governanceSyncService: GovernanceSyncService,
    private readonly governanceMigrationService: GovernanceMigrationService,
  ) {}

  @Post('trigger')
  async triggerManualSync(@Body() body: { forceRefresh?: boolean } = {}) {
    const { forceRefresh = false } = body;
    return this.governanceSyncService.triggerManualGovernanceSync(forceRefresh);
  }

  @Get('status')
  async getStatus() {
    const [dataStatus, stats] = await Promise.all([
      this.governanceMigrationService.checkGovernanceDataStatus(),
      this.governanceMigrationService.getGovernanceStats(),
    ]);

    return {
      message: 'Governance sync is configured to run daily at midnight',
      manualTriggerAvailable: true,
      dataStatus,
      stats,
    };
  }

  @Get('migration-status')
  async getMigrationStatus() {
    const [dataStatus, integrity, stats] = await Promise.all([
      this.governanceMigrationService.checkGovernanceDataStatus(),
      this.governanceMigrationService.validateGovernanceDataIntegrity(),
      this.governanceMigrationService.getGovernanceStats(),
    ]);

    return {
      dataStatus,
      integrity,
      stats,
    };
  }
}