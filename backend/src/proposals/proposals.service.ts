import { HttpException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Proposal } from 'src/entities/governance/proposal.entity';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectDataSource('default')
    private readonly dataSource: DataSource,
  ) {}
  
  async getProposalByQuery(query: string) {
    const proposals = await this.dataSource
      .getRepository(Proposal)
      .createQueryBuilder('proposal')
      .where('proposal.id ILIKE :query', { query: `%${query}%` })
      .orWhere('proposal.txHash ILIKE :query', { query: `%${query}%` })
      .orWhere('proposal.governanceType ILIKE :query', { query: `%${query}%` })
      .orderBy('proposal.createdAt', 'DESC')
      .limit(20)
      .getMany();

    return proposals.map(proposal => ({
      id: proposal.id,
      txHash: proposal.txHash,
      governanceType: proposal.governanceType,
      governanceDescription: proposal.governanceDescription,
      depositLovelace: proposal.depositLovelace,
      returnStakeAddress: proposal.returnStakeAddress,
      ratifiedEpoch: proposal.ratifiedEpoch,
      enactedEpoch: proposal.enactedEpoch,
      droppedEpoch: proposal.droppedEpoch,
      expiredEpoch: proposal.expiredEpoch,
      expirationEpoch: proposal.expirationEpoch,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
    }));
  }
}
