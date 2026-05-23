import { Injectable, NotFoundException } from '@nestjs/common';
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

    return proposals.map((p) => this.serializeProposal(p));
  }

  async getProposalById(id: string) {
    const proposal = await this.dataSource
      .getRepository(Proposal)
      .createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.metadata', 'metadata')
      .where('proposal.id = :id', { id })
      .getOne();

    if (!proposal) throw new NotFoundException(`Proposal ${id} not found`);

    const voteRows: { voter_role: string; vote: string; count: string }[] =
      await this.dataSource.query(
        `SELECT voter_role, vote, COUNT(*) as count
         FROM proposal_votes
         WHERE proposal_id = $1
         GROUP BY voter_role, vote`,
        [id],
      );

    const votes: Record<string, Record<string, number>> = {};
    for (const row of voteRows) {
      if (!votes[row.voter_role]) votes[row.voter_role] = {};
      votes[row.voter_role][row.vote] = parseInt(row.count, 10);
    }

    return {
      ...this.serializeProposal(proposal),
      metadata: proposal.metadata
        ? {
            url: proposal.metadata.url,
            hash: proposal.metadata.hash,
            body: proposal.metadata.jsonMetadata,
          }
        : null,
      votes,
    };
  }

  private serializeProposal(proposal: Proposal) {
    return {
      id: proposal.id,
      txHash: proposal.txHash,
      certIndex: proposal.certIndex,
      governanceType: proposal.governanceType,
      governanceDescription: proposal.governanceDescription,
      depositLovelace: proposal.depositLovelace,
      returnStakeAddress: proposal.returnStakeAddress,
      ratifiedEpoch: proposal.ratifiedEpoch,
      enactedEpoch: proposal.enactedEpoch,
      droppedEpoch: proposal.droppedEpoch,
      expiredEpoch: proposal.expiredEpoch,
      expirationEpoch: proposal.expirationEpoch,
      blockTime: proposal.blockTime,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
    };
  }
}
