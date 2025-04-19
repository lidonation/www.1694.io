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

  private readonly BASE_URL = this.configService.get<string>('PDF_BASE_URL');
  async findAll({
    page = 1,
    pageSize = 15,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    category = '',
  }: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    category?: string;
  }): Promise<any> {
    try {
      const filters: any = {
        'filters[$and][0][is_active]': true,
        'filters[$and][1][bd_psapb][type_name][id]': [1, 2, 3, 4, 5],
      };

      if (search) {
        filters[
          'filters[$and][2][$or][0][bd_proposal_detail][proposal_name][$containsi]'
        ] = search;
        filters['filters[$and][2][$or][1][description][$containsi]'] = search;
        filters[
          'filters[$and][2][$or][2][creator][govtool_username][$containsi]'
        ] = search;
        filters[
          'filters[$and][2][$or][3][bd_psapb][problem_statement][$containsi]'
        ] = search;
        filters[
          'filters[$and][2][$or][4][bd_psapb][proposal_benefit][$containsi]'
        ] = search;
      }

      if (category) {
        const categoryArray = category.split(',').map((cat) => cat.trim());
        filters['filters[$and][3][bd_psapb][type_name][type_name][$in]'] =
          categoryArray;
      }

      let backendSortField = 'createdAt';
      switch (sortBy) {
        case 'budget':
          backendSortField = 'bd_costing.ada_amount';
          break;
        case 'alphabetical':
          backendSortField = 'bd_proposal_detail.proposal_name';
          break;
        case 'lastModified':
          backendSortField = 'updatedAt';
          break;
        case 'conversionRate':
          backendSortField = 'prop_comments_number';
          break;
        default:
          backendSortField = 'createdAt';
      }

      const sort = `${backendSortField}:${sortOrder}`;
      const url = `${this.BASE_URL}/bds`;

      const { data } = await firstValueFrom(
        this.httpService
          .get(url, {
            params: {
              ...filters,
              'pagination[page]': page,
              'pagination[pageSize]': pageSize,
              'sort[0]': sort,
              'populate[0]': 'bd_costing',
              'populate[1]': 'bd_psapb.type_name',
              'populate[2]': 'bd_proposal_detail',
              'populate[3]': 'creator',
            },
          })
          .pipe(
            catchError((error) => {
              console.error(
                'Error fetching filtered proposals:',
                error?.response?.data || error,
              );
              throw error;
            }),
          ),
      );

      return data;
    } catch (error) {
      console.error(
        'Error fetching proposals:',
        error?.response?.data || error,
      );
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

  async createComment(commentData: any, authorization: string): Promise<any> {
    try {
      const url = `${this.BASE_URL}/comments`;
      const { data } = await firstValueFrom(
        this.httpService
          .post(url, commentData, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: authorization,
            },
          })
          .pipe(
            catchError((error) => {
              console.error('Error creating comment:', error);
              throw error;
            }),
          ),
      );
      return data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  async findPoll(id: string): Promise<any> {
    try {
      const url = `${this.BASE_URL}/bd-polls`;
      const { data } = await firstValueFrom(
        this.httpService
          .get(url, {
            params: {
              'filters[$and][0][bd_proposal_id][$eq]': id,
              'filters[$and][1][is_poll_active]': true,
              'pagination[page]': 1,
              'pagination[pageSize]': 1,
              'sort[createdAt]': 'desc',
            },
          })
          .pipe(
            catchError((error) => {
              console.error(`Error fetching poll for ID ${id}:`, error);
              throw error;
            }),
          ),
      );
      return data;
    } catch (error) {
      console.error(`Error fetching poll for ID ${id}:`, error);
      throw error;
    }
  }

  async createVote(voteData: any, authorization: string): Promise<any> {
    try {
      const url = `${this.BASE_URL}/bd-poll-votes`;
      const { data } = await firstValueFrom(
        this.httpService
          .post(url, voteData, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: authorization,
            },
          })
          .pipe(
            catchError((error) => {
              console.error('Error creating vote:', error);
              throw error;
            }),
          ),
      );
      return data;
    } catch (error) {
      console.error('Error creating vote:', error);
      throw error;
    }
  }
}
