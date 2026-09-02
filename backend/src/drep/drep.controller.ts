import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { createDrepDto, ValidateMetadataDTO } from 'src/dto';
import { DrepService } from './drep.service';
import { VoterService } from 'src/voter/voter.service';
import { Delegation } from 'src/common/types';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';
import { MiscellaneousService } from 'src/miscellaneous/miscellaneous.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('dreps')
export class DrepController {
  constructor(
    private drepService: DrepService,
    private voterService: VoterService,
    private miscService: MiscellaneousService,
  ) {}
  @Get('')
  getAll(
    @Query('s', new DefaultValuePipe('')) s: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('perPage', new DefaultValuePipe(24), ParseIntPipe)
    perPage: number,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('onChainStatus') onChainStatus?: 'active' | 'inactive',
    @Query('campaignStatus') campaignStatus?: 'claimed' | 'unclaimed',
    @Query('includeRetired') includeRetired?: 'true' | 'undefined',
    @Query('type') type?: 'has_script',
  ) {
    return this.drepService.getAllDReps(
      s,
      page,
      perPage,
      sort,
      order,
      onChainStatus,
      campaignStatus,
      Boolean(includeRetired),
      type,
    );
  }

  @Get('verify-ownership')
  verifyDrepOwnership(
    @Query('voterId') voterId: string,
    @Query('drepId') drepId: string,
  ) {
    return this.drepService.verifyOwnership(voterId, drepId);
  }

  @Get('epochs/latest/parameters')
  getEpochParams() {
    return this.drepService.getEpochParams();
  }
  @Get(':id/drep')
  async getSingle(@Param('id') drepId: number) {
    return this.drepService.getSingleDrepViaID(drepId);
  }

  @Get('/media')
  async getMedia(@Res() res: Response, @Query('assetUrl') assetUrl?: string) {
    return this.miscService.getMedia(res, assetUrl);
  }

  @Get(':voterId/voter')
  async getSingleViaVoterId(@Param('voterId') voterId: string) {
    return this.drepService.getSingleDrepViaVoterID(voterId);
  }

  @Get(':voterId/activity')
  async getDrepActivity(
    @Param('voterId') voterId: string,
    @Query('stakeKey') stakeKey?: string,
    @Query('stakeKeyBech32') stakeKeyBech32?: string,
    @Query('cursor') cursor?: string,
    @Query('endTimeCursor') endTimeCursor?: number,
    @Query('startTimeCursor') startTimeCursor?: number,
    @Query('filterValues') filterValues?: string[],
    @Query('minItems') minItems: number = 10,
    @Query('recursionDepth') recursionDepth: number = 0,
    @Query('maxRecursionDepth') maxRecursionDepth: number = 3,
    @Query('loadDirection') loadDirection: string = 'older',
  ) {
    let delegation: Delegation = null;
    const dRep = await this.drepService.getVoltaireDRepViaVoterID(voterId);

    if (stakeKey) {
      delegation =
        await this.voterService.getAdaHolderCurrentDelegation(stakeKey);
    }

    const drepTimeline = await lastValueFrom(
      this.drepService.getDrepTimelineWithMinItems({
        dRep,
        voterId,
        stakeKeyBech32,
        cursor,
        delegation,
        endTimeCursor,
        startTimeCursor,
        filterValues,
        minItems,
        recursionDepth,
        maxRecursionDepth,
        loadDirection,
      }),
    );

    return drepTimeline;
  }

  @UseGuards(JwtAuthGuard)
  @Post('new')
  create(@Body() drepDto: createDrepDto) {
    return this.drepService.registerDrep(drepDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/update')
  updateDetails(@Param('id') drepId: number, @Body() drep: createDrepDto) {
    return this.drepService.updateDrepInfo(drepId, drep);
  }

  @Get(':voterId/metadata')
  getMetadata(@Param('voterId') voterId: string) {
    return this.drepService.getMetadata(voterId);
  }

  @Post('metadata/validate')
  validateMetadata(@Body() metadataBody: ValidateMetadataDTO) {
    return this.drepService.validateMetadata(metadataBody);
  }

  @UseGuards(JwtAuthGuard)
  @Post('metadata/save')
  saveMetadata(@Body('metadata') metadata: any) {
    return this.drepService.saveMetadata(metadata);
  }

  @Get(':voterId/stats')
  getStats(@Param('voterId') voterId: string) {
    return this.drepService.getStats(voterId);
  }

  @Get(':voterId/is-registered')
  isRegistered(@Param('voterId') voterId: string) {
    return this.drepService.isDrepRegistered(voterId);
  }

  @Get(':voterId/delegators')
  getDrepDelegators(
    @Param('voterId') voterId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('perPage', new DefaultValuePipe(24), ParseIntPipe)
    perPage: number,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    return this.drepService.getDrepDelegatorsWithVotingPower(
      voterId,
      page,
      perPage,
      sort,
      order,
    );
  }

  @Get(':voterId/gov-actions-votes')
  getDRepGovActionsVotes(
    @Param('voterId') voterId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('perPage', new DefaultValuePipe(6), ParseIntPipe)
    perPage: number,
  ) {
    return this.drepService.getDRepVotedGovActions(voterId, page, perPage);
  }

  @Get(':stakeKey/profile-data')
  getVoterProfileData(@Param('stakeKey') stakeKey: string) {
    return this.drepService.getVoterProfileData(stakeKey);
  }

  @Get(':voterId/claimed-profiles')
  getClaimedProfiles(@Param('voterId') voterId: string) {
    return this.drepService.getClaimedProfiles(voterId);
  }

  @Get(':voterId/governance-participation')
  getGovernanceParticipation(@Param('voterId') voterId: string) {
    return this.drepService.getGovernanceParticipation(voterId);
  }
}
