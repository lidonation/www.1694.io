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
  Search,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { createDrepDto, ValidateMetadataDTO } from 'src/dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { DrepService } from './drep.service';
import { VoterService } from 'src/voter/voter.service';
import { Delegation, StakeKeys } from 'src/common/types';
import { Response } from 'express';

@Controller('dreps')
export class DrepController {
  constructor(
    private drepService: DrepService,
    private voterService: VoterService,
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
  ) {
    return this.drepService.getAllDReps(
      s,
      page,
      perPage,
      sort,
      order,
      onChainStatus,
      campaignStatus,
    );
  }
  @Get('epochs/latest/parameters')
  getEpochParams() {
    return this.drepService.getEpochParams();
  }
  @Get(':id/drep')
  async getSingle(
    @Param('id') drepId: number,
    @Query('stakeKeys') stakeKeys?: StakeKeys,
    @Query('startTimeCursor') startTimeCursor?: number,
    @Query('endTimeCursor') endTimeCursor?: number,
  ) {
    const { stakeKey, stakeKeyBech32 } = stakeKeys || {};
    let delegation: Delegation = null;

    if (stakeKey) {
      delegation =
        await this.voterService.getAdaHolderCurrentDelegation(stakeKey);
    }
    return this.drepService.getSingleDrepViaID(
      drepId,
      stakeKeyBech32,
      delegation,
      startTimeCursor,
      endTimeCursor,
    );
  }
  @Get(':voterId/voter')
  async getSingleViaVoterId(
    @Param('voterId') voterId: string,
    @Query('stakeKeys') stakeKeys?: StakeKeys,
    @Query('startTimeCursor') startTimeCursor?: number,
    @Query('endTimeCursor') endTimeCursor?: number,
  ) {
    const { stakeKey, stakeKeyBech32 } = stakeKeys || {};

    let delegation: Delegation = null;

    if (stakeKey) {
      delegation =
        await this.voterService.getAdaHolderCurrentDelegation(stakeKey);
    }
    return this.drepService.getSingleDrepViaVoterID(
      voterId,
      stakeKeyBech32,
      delegation,
      startTimeCursor,
      endTimeCursor,
    );
  }

  @Get(':idOrVoterId/activity')
  async getDrepActivity(
    @Param('idOrVoterId') idOrVoterId: string,
    @Query('stakeKeys') stakeKeys?: StakeKeys,
    @Query('startTimeCursor') startTimeCursor?: number,
    @Query('endTimeCursor') endTimeCursor?: number,
  ) {
    let drepId: number | undefined;
    let drepVoterId: string | undefined;
    let drep = null;
    let delegation: Delegation = null;

    const { stakeKey, stakeKeyBech32 } = stakeKeys || {};

    if (!isNaN(Number(idOrVoterId))) {
      drepId = Number(idOrVoterId);
    } else {
      drepVoterId = idOrVoterId;
    }

    if (drepId) {
      drep = await this.drepService.getSingleDrepViaID(drepId);
      drepVoterId = drep.signature_drepVoterId
    } else if (drepVoterId) {
      drep = await this.drepService.getSingleDrepViaVoterID(drepVoterId);
    }

    if (stakeKey) {
      delegation =
        await this.voterService.getAdaHolderCurrentDelegation(stakeKey);
    }

    const drepTimeline = await this.drepService.getDrepTimeline(
      drep,
      drepVoterId,
      stakeKeyBech32,
      delegation,
      startTimeCursor,
      endTimeCursor,
    );

    return drepTimeline;
  }

  @Post('new')
  @UseInterceptors(FileInterceptor('profileUrl'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() drepDto: createDrepDto,
  ) {
    return this.drepService.registerDrep(drepDto, file);
  }
  @Post(':id/update')
  @UseInterceptors(FileInterceptor('profileUrl'))
  updateDetails(
    @UploadedFile() profileUrl: Express.Multer.File,
    @Param('id') drepId: number,
    @Body() drep: createDrepDto,
  ) {
    return this.drepService.updateDrepInfo(drepId, drep, profileUrl);
  }
  @Get('/metadata/external')
  getExternalMetadata(@Query('metadataUrl') metadataUrl: string) {
    return this.drepService.getMetadataFromExternalLink(metadataUrl);
  }
  @Get(':drepId/metadata/:hash')
  getMetadata(@Param('drepId') drepId: number, @Param('hash') hash: string,  @Res() res: Response,) {
    return this.drepService.getMetadata(drepId, hash, res);
  }
  @Post('metadata/validate')
  validateMetadata(@Body() metadataBody: ValidateMetadataDTO) {
    return this.drepService.validateMetadata(metadataBody);
  }

  @Post('metadata/save')
  saveMetadata(
    @Body('metadata') metadata: any,
    @Body('hash') hash: string,
    @Body('drepId') drepId: number,
    @Body('name') name: string,
  ) {
    return this.drepService.saveMetadata(metadata, hash, drepId, name);
  }
  @Get(':voterId/stats')
  getStats(@Param('voterId') voterId: string) {
    return this.drepService.getStats(voterId);
  }
}
