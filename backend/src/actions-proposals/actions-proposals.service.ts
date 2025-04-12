import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class ActionsProposalsService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  private readonly BASE_URL = this.configService.get<string>(
    'PDF_BASE_URL',
  );;

  async findAll(page: number = 1, pageSize: number = 6): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get(this.BASE_URL, {
            params: {
              'filters[$and][0][is_active]': true,
              'filters[$and][1][bd_psapb][type_name][id]': [1, 2, 3, 4, 5],
              'filters[$and][2][bd_proposal_detail][proposal_name][$containsi]': '',
              'pagination[page]': page,
              'pagination[pageSize]': pageSize,
              'sort[createdAt]': 'desc',
              'populate[0]': 'bd_costing',
              'populate[1]': 'bd_psapb.type_name',
              'populate[2]': 'bd_proposal_detail',
              'populate[3]': 'creator',
            },
          })
          .pipe(
            catchError((error) => {
              console.error('Error fetching data:', error);
              throw error;
            }),
          ),
      );
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

  async findOne(id: string) {}
}
