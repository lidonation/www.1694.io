import { Module } from '@nestjs/common';
import { BlockfrostService } from './blockfrost.service';

@Module({
  providers: [BlockfrostService],
})
export class BlockfrostModule {}
