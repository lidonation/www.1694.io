import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BlockfrostService } from './blockfrost.service';

@Module({
  imports: [HttpModule],
  providers: [BlockfrostService],
  exports: [BlockfrostService],
})
export class BlockfrostModule {}
