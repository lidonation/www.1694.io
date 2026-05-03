import { Controller, Post, Body, Logger, Get, Param } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Queues, JobTypes } from './queue.types';
import { GovernanceMigrationService } from './governance/governance-migration.service';
import { BlockfrostService } from './blockfrost/blockfrost.service';

@Controller('sync-trigger')
export class SyncTriggerController {
  private readonly logger = new Logger(SyncTriggerController.name);

  constructor(
    @InjectQueue(Queues.STAKE_SYNC)
    private stakeSyncQueue: Queue,
    @InjectQueue(Queues.GOVERNANCE_SYNC)
    private governanceSyncQueue: Queue,
    @InjectQueue(Queues.PROPOSALS_SYNC)
    private proposalsSyncQueue: Queue,
    @InjectQueue(Queues.DREP_VOTES_SYNC)
    private drepVotesSyncQueue: Queue,
    @InjectQueue(Queues.TIMELINE_WATCHER)
    private timelineWatcherQueue: Queue,
    private readonly governanceMigrationService: GovernanceMigrationService,
    private readonly blockfrostService: BlockfrostService,
  ) {}

  @Post('stake/trigger')
  async triggerStakeSync() {
    await this.stakeSyncQueue.add(JobTypes.STAKE_SYNC, {});
    this.logger.log('Triggered manual stake sync job');
    return { success: true, message: 'Manual stake sync triggered' };
  }

  @Post('governance/trigger')
  async triggerGovernanceSync(@Body() body: { forceRefresh?: boolean; syncOnly?: 'dreps' | 'delegators' | 'proposals' | 'metadata-votes' } = {}) {
    const { forceRefresh = false, syncOnly } = body;
    await this.governanceSyncQueue.add(
      `${JobTypes.GOVERNANCE_SYNC}-manual`,
      { forceRefresh, syncOnly }
    );
    this.logger.log(`Triggered manual governance sync job (forceRefresh: ${forceRefresh}, syncOnly: ${syncOnly})`);
    return { success: true, message: `Manual governance sync triggered${syncOnly ? ` (only: ${syncOnly})` : ''}` };
  }

  @Post('proposals/trigger')
  async triggerProposalsSync(@Body() body: { forceRefresh?: boolean } = {}) {
    const { forceRefresh = false } = body;
    await this.proposalsSyncQueue.add(
      JobTypes.PROPOSALS_SYNC,
      { forceRefresh },
      {
        removeOnComplete: 10,
        removeOnFail: 10,
      }
    );
    this.logger.log(`Triggered manual proposals sync job (forceRefresh: ${forceRefresh})`);
    return { success: true, message: 'Manual proposals sync triggered' };
  }

  @Post('drep-votes/trigger')
  async triggerDrepVotesSync(@Body() body: { forceRefresh?: boolean } = {}) {
    const { forceRefresh = false } = body;
    await this.drepVotesSyncQueue.add(
      `${JobTypes.DREP_VOTES_SYNC}-manual`,
      { forceRefresh }
    );
    this.logger.log(`Triggered manual DRep votes sync job (forceRefresh: ${forceRefresh})`);
    return { success: true, message: 'Manual DRep votes sync triggered' };
  }

  @Post('timeline-watcher/trigger')
  async triggerTimelineWatcher() {
    await this.timelineWatcherQueue.add(JobTypes.TIMELINE_WATCHER, {});
    this.logger.log('Triggered manual timeline watcher job');
    return { success: true, message: 'Manual timeline watcher triggered' };
  }

  @Get('governance/status')
  async getGovernanceStatus() {
    const [dataStatus, stats] = await Promise.all([
      this.governanceMigrationService.checkGovernanceDataStatus(),
      this.governanceMigrationService.getGovernanceStats(),
    ]);

    return {
      message: 'Governance sync is managed by queue-backend',
      dataStatus,
      stats,
    };
  }

  @Get('blockfrost/test/:drepId')
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
