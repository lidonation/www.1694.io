import { Module } from '@nestjs/common';
import { MiscellaneousController } from './miscellaneous.controller';
import { MiscellaneousService } from './miscellaneous.service';
import { BlockfrostModule } from '../blockfrost/blockfrost.module';
import { IpfsService } from 'src/ipfs/ipfs.service';

@Module({
  imports: [BlockfrostModule],
  controllers: [MiscellaneousController],
  providers: [MiscellaneousService, IpfsService],
})
export class MiscellaneousModule {}
