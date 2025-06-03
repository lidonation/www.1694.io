import { Global, Module } from '@nestjs/common';
import { MiscellaneousController } from './miscellaneous.controller';
import { MiscellaneousService } from './miscellaneous.service';
import { BlockfrostService } from 'src/blockfrost/blockfrost.service';

@Global()
@Module({
  controllers: [MiscellaneousController],
  providers: [MiscellaneousService, BlockfrostService],
  exports: [MiscellaneousService],
})
export class MiscellaneousModule {}
