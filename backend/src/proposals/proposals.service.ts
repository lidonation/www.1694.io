import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class ProposalsService {
  constructor() {}
  async getProposalByQuery(query: string) {
    // Service disabled as part of dbsync migration
    throw new HttpException('Proposal search temporarily unavailable during migration', 503);
  }
}
