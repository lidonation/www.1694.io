import { HttpException, Injectable } from '@nestjs/common';
import { getProposalByHashQuery } from 'src/queries/getProposalsViaQuery';
import { CardanoRepository } from 'src/repository/cardano/cardano.repository';

@Injectable()
export class ProposalsService {
  constructor(private cardanoRepository: CardanoRepository) {}
  async getProposalByQuery(query: string) {
    if (!query) throw new HttpException('query is required', 400);
    if (query.length < 5)
      throw new HttpException(
        'Query string should be greater than 5 chars',
        400,
      );
    const matchingProposals = await this.cardanoRepository.query(
      getProposalByHashQuery,
      [`%${query}%`],
    );
    if (!matchingProposals.length)
      throw new HttpException('No matching proposals found', 404);
    return matchingProposals;
  }
}
