import { Module } from '@nestjs/common';
import { DrepController } from './drep.controller';
import { DrepService } from './drep.service';
import { VoterService } from 'src/voter/voter.service';
import { BlockfrostService } from 'src/blockfrost/blockfrost.service';
import { MiscellaneousService } from 'src/miscellaneous/miscellaneous.service';
import { IpfsService } from 'src/ipfs/ipfs.service';

@Module({
  controllers: [DrepController],
  providers: [
    DrepService,
    VoterService,
    BlockfrostService,
    MiscellaneousService,
    IpfsService,
  ],
})
export class DrepModule {}
