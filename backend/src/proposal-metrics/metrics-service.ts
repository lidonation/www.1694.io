import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, of } from 'rxjs';

@Injectable()
export class MetricsService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  private readonly METRICS_URL =
    this.configService.get<string>('METRICS_BASE_URL');

  async getProposalMetrics(search?: string, category?: string): Promise<any> {
    try {
      let url = `${this.METRICS_URL}/cardano/budget-proposals/metrics`;
      const queryParams = {
        s: search,
        category,
      };

      for (const param in queryParams) {
        if (
          queryParams[param] === undefined ||
          queryParams[param] === null ||
          queryParams[param] === ''
        ) {
          delete queryParams[param];
        }
      }

      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;

      const { data } = await firstValueFrom(
        this.httpService.get(url).pipe(
          catchError((error) => {
            console.error(
              'Error fetching proposal metrics:',
              error?.response?.data || error,
            );
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
  async getCatalystParticipation(govToolUserName: string): Promise<number> {
    try {
      if (!govToolUserName) {
        return 0;
      }

      const url = `${this.METRICS_URL}/cardano/budget-proposals/metrics/catalyst-proposals/${govToolUserName}`;
      const response = await firstValueFrom(
        this.httpService.get(url).pipe(
          catchError((error) => {
            console.error(
              'Error fetching catalyst participation:',
              error?.response?.data || error,
            );
            return of({ data: null});
          }),
        ),
      );

      return response?.data;
    } catch (error) {
      console.error('Error fetching catalyst participation:', error);
      return 0;
    }
  }
}
