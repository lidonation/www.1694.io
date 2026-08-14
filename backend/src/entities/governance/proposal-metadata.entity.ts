import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Proposal } from './proposal.entity';

@Entity('proposal_metadata')
@Index('idx_proposal_metadata_proposal', ['proposalId'])
@Index('idx_proposal_metadata_url', ['url'])
@Index('idx_proposal_metadata_version', ['version'])
export class ProposalMetadata {
  @PrimaryColumn({ name: 'proposal_id', type: 'text' })
  proposalId: string; // Foreign key to proposals.id

  @Column({ name: 'url', type: 'text', nullable: true })
  url: string | null;

  @Column({ name: 'hash', type: 'text', nullable: true })
  hash: string | null;

  @Column({ name: 'json_metadata', type: 'jsonb', nullable: true })
  jsonMetadata: any; // CIP-108 validated JSON

  @Column({ name: 'bytes', type: 'text', nullable: true })
  bytes: string | null; // raw metadata

  @Column({ name: 'version', type: 'text' })
  version: 'v1' | 'v2';

  @Column({ name: 'error', type: 'jsonb', nullable: true })
  error: any | null; // error object if fetch/validation failed

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Proposal, (proposal) => proposal.metadata)
  @JoinColumn({ name: 'proposal_id' })
  proposal: Proposal;
}
