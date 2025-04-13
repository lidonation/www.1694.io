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

  async findAll(page: number = 1, pageSize: number = 12): Promise<any> {
    try {
      const url = `${this.BASE_URL}/bds`;
      const { data } = await firstValueFrom(
        this.httpService
          .get(url, {
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

  async findOne(id: string): Promise<any> {
    try {
      const url = `${this.BASE_URL}/bds/${id}`;
      const { data } = await firstValueFrom(
        this.httpService
          .get(url, {
            params: {
              'populate[0]': 'creator',
              'populate[1]': 'bd_costing.preferred_currency',
              'populate[2]': 'bd_proposal_detail.contract_type_name',
              'populate[3]': 'bd_further_information.proposal_links',
              'populate[4]': 'bd_psapb.type_name',
              'populate[5]': 'bd_psapb.roadmap_name',
              'populate[6]': 'bd_psapb.committee_name',
              'populate[7]': 'bd_proposal_ownership.be_country',
            },
          })
          .pipe(
            catchError((error) => {
              console.error(`Error fetching data for ID ${id}:`, error);
              throw error;
            }),
          ),
      );
      return data;
    } catch (error) {
      console.error(`Error fetching data for ID ${id}:`, error);
      throw error;
    }
  }

  async findComments(id: string): Promise<any> {
    try {
      const url = `${this.BASE_URL}/comments`;
      const { data } = await firstValueFrom(
        this.httpService
          .get(url, {
            params: {
              'filters[$and][0][bd_proposal_id]': id,
              'sort[createdAt]': 'desc',
              'pagination[page]': 1,
              'pagination[pageSize]': 25,
              'populate[comments_reports][populate][reporter][fields][0]':
                'username',
              'populate[comments_reports][populate][maintainer][fields][0]':
                'username',
            },
          })
          .pipe(
            catchError((error) => {
              console.error(`Error fetching comments for ID ${id}:`, error);
              throw error;
            }),
          ),
      );
      return data;
    } catch (error) {
      console.error(`Error fetching comments for ID ${id}:`, error);
      throw error;
    }
  }
}
