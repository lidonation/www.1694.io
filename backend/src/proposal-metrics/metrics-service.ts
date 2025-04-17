import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class MetricsService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  private readonly METRICS_URL = this.configService.get<string>('METRICS_BASE_URL') || 'https://www.lidonation.com/api/cardano/budget-proposals';

  async getProposalMetrics(): Promise<any> {
    try {
      const url = `${this.METRICS_URL}/metrics`;
      const { data } = await firstValueFrom(
        this.httpService.get(url).pipe(
          catchError((error) => {
            console.error('Error fetching proposal metrics:', error?.response?.data || error);
            throw error;
          }),
        ),
      );
      return data;
    } catch (error) {
      console.error('Error fetching proposal metrics:', error);
      throw error;
    }
  }
}