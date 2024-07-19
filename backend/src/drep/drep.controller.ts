import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { createDrepDto } from 'src/dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { DrepService } from './drep.service';
import { VoterService } from 'src/voter/voter.service';
import { Delegation, StakeKeys } from 'src/common/types';

@Controller('dreps')
export class DrepController {
  constructor(
    private drepService: DrepService,
    private voterService: VoterService,
  ) {}
  @Get('')
  getAll() {
    return this.drepService.getAllDreps();
  }
  @Get('epochs/latest/parameters')
  getEpochParams() {
    return this.drepService.getEpochParams();
  }
  @Get(':id/drep')
  async getSingle(@Param('id') drepId: number, @Query() stakeKeys?: StakeKeys) {
    const { stakeKey, stakeKeyBech32 } = stakeKeys;

    let delegation: Delegation = null;

    if (stakeKey) {
      delegation =
        await this.voterService.getAdaHolderCurrentDelegation(stakeKey);
    }
    return this.drepService.getSingleDrepViaID(
      drepId,
      stakeKeyBech32,
      delegation,
    );
  }
  @Get(':voterId/voter')
  async getSingleViaVoterId(
    @Param('voterId') voterId: string,
    @Query() stakeKeys?: StakeKeys,
  ) {
    const { stakeKey, stakeKeyBech32 } = stakeKeys;

    let delegation: Delegation = null;

    if (stakeKey) {
      delegation =
        await this.voterService.getAdaHolderCurrentDelegation(stakeKey);
    }
    return this.drepService.getSingleDrepViaVoterID(
      voterId,
      stakeKeyBech32,
      delegation,
    );
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
}
