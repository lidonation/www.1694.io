import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('proposal_votes')
@Index('idx_proposal_vote_proposal', ['proposalId'])
@Index('idx_proposal_vote_voter', ['voter'])
@Index('idx_proposal_vote_role', ['voterRole'])
@Index('idx_proposal_vote_composite', ['proposalId', 'voter'], { unique: true })
@Index('idx_proposal_vote_tx', ['txHash', 'certIndex'])
export class ProposalVote {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: string;

  @Column({ name: 'proposal_id', type: 'text' })
  proposalId: string; // Foreign key to proposals.id

  @Column({ name: 'tx_hash', type: 'text' })
  txHash: string;

  @Column({ name: 'cert_index', type: 'integer' })
  certIndex: number;

  @Column({ name: 'voter_role', type: 'text' })
  voterRole: 'constitutional_committee' | 'drep' | 'spo';

  @Column({ name: 'voter', type: 'text' })
  voter: string; // voter identifier (bech32 for stake or committee key)

  @Column({ name: 'vote', type: 'text' })
  vote: 'yes' | 'no' | 'abstain';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'block_time', type: 'timestamptz', nullable: true })
  blockTime: Date | null;

  @Column({ name: 'voting_power_lovelace', type: 'bigint', nullable: true })
  votingPowerLovelace: string | null;
}
