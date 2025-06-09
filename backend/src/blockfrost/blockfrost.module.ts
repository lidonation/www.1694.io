import { Module } from '@nestjs/common';
import { BlockfrostService } from './blockfrost.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [BlockfrostService],
})
export class BlockfrostModule {}
