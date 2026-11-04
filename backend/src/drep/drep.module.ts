import { Module } from '@nestjs/common';
import { DrepController } from './drep.controller';
import { DrepService } from './drep.service';
import { VoterService } from 'src/voter/voter.service';
import { BlockfrostModule } from '../blockfrost/blockfrost.module';
import { MiscellaneousService } from 'src/miscellaneous/miscellaneous.service';
import { IpfsService } from 'src/ipfs/ipfs.service';
import { GovernanceModule } from 'src/governance/governance.module';

@Module({
  imports: [GovernanceModule, BlockfrostModule],
  controllers: [DrepController],
  providers: [DrepService, VoterService, MiscellaneousService, IpfsService],
})
export class DrepModule {}
