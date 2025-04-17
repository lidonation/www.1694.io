import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics-service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(@Query('s') search?: string) {
    return this.metricsService.getProposalMetrics(search);
  }
}
