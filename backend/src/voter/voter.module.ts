import { Module } from '@nestjs/common';
import { VoterService } from './voter.service';
import { VoterController } from './voter.controller';
import { BlockfrostModule } from '../blockfrost/blockfrost.module';

@Module({
  imports: [BlockfrostModule],
  controllers: [VoterController],
  providers: [VoterService],
  exports: [VoterService],
})
export class VoterModule {}
