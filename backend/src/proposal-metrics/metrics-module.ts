import { Module } from '@nestjs/common';
import { MetricsService } from './metrics-service';
import { MetricsController } from './metrics-controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}