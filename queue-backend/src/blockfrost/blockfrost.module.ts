import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RequestBudget } from './request-budget';
import { BlockfrostService } from './blockfrost.service';

@Module({
  imports: [HttpModule],
  providers: [BlockfrostService, RequestBudget],
  exports: [BlockfrostService],
})
export class BlockfrostModule {}
