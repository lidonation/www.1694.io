import { Controller, Get, Param, Query } from '@nestjs/common';
import { MetricsService } from './metrics-service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(
    @Query('s') search?: string,
    @Query('category') category?: string,
    @Query('committee') committee?: string,
  ) {
    return this.metricsService.getProposalMetrics(search, category, committee);
  }

  @Get('catalyst-proposals/:username')
  async getCatalystParticipation(@Param('username') username: string) {
    return await this.metricsService.getCatalystParticipation(username);
  }
}
