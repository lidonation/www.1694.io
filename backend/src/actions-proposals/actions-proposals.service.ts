import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class ActionsProposalsService {
  private readonly BASE_URL: string;
  private readonly CX_BASE_URL: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.BASE_URL = this.configService.get<string>('PDF_BASE_URL') || '';
    this.CX_BASE_URL = this.configService.get<string>('METRICS_BASE_URL') || '';
  }
  async findAll({
    page = 1,
    pageSize = 12,
    search = '',
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    category = [],
    committee = [],
  }: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    category?: string | string[];
    committee?: string | string[];
  }): Promise<any> {
    try {
      let backendSortField = 'updatedAt';
      switch (sortBy) {
        case 'budget':
          backendSortField = 'adaAmount';
          break;
        case 'alphabetical':
          backendSortField = 'proposalName';
          break;
        case 'lastModified':
          backendSortField = 'updatedAt';
          break;
        case 'conversationRate':
          backendSortField = 'commentsCount';
          break;
        default:
          backendSortField = 'updatedAt';
      }

      const url = `${this.CX_BASE_URL}/cardano/budget-proposals`;
      const sanitizedSearch = search ? search.replace(/'/g, "''") : '';

      const params: any = {
        s: sanitizedSearch,
        page,
        limit: pageSize,
        sortBy: backendSortField,
        sortOrder,
        category,
        committee,
      };
      const { data } = await firstValueFrom(
        this.httpService.get(url, { params }).pipe(
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
