import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('proposals')
@Index('idx_proposal_id', ['id'], { unique: true })
@Index('idx_proposal_tx', ['txHash', 'certIndex'], { unique: true })
@Index('idx_proposal_type', ['governanceType'])
@Index('idx_proposal_ratified', ['ratifiedEpoch'])
@Index('idx_proposal_enacted', ['enactedEpoch'])
@Index('idx_proposal_dropped', ['droppedEpoch'])
@Index('idx_proposal_expired', ['expiredEpoch'])
export class Proposal {
  @PrimaryColumn({ name: 'id', type: 'text' })
  id: string; // CIP-129 Governance Action Identifier

  @Column({ name: 'tx_hash', type: 'text' })
  txHash: string;

  @Column({ name: 'cert_index', type: 'integer' })
  certIndex: number;

  @Column({ name: 'governance_type', type: 'text' })
  governanceType:
    | 'hard_fork_initiation'
    | 'new_committee'
    | 'new_constitution'
    | 'info_action'
    | 'no_confidence'
    | 'parameter_change'
    | 'treasury_withdrawals';

  @Column({ name: 'governance_description', type: 'jsonb', nullable: true })
  governanceDescription: any; // Optional JSON map, human-readable

  @Column({ name: 'deposit_lovelace', type: 'bigint', nullable: true })
  depositLovelace: string | null;

  @Column({ name: 'return_stake_address', type: 'text', nullable: true })
  returnStakeAddress: string | null; // stake address that receives deposit refund

  @Column({ name: 'ratified_epoch', type: 'integer', nullable: true })
  ratifiedEpoch: number | null;

  @Column({ name: 'enacted_epoch', type: 'integer', nullable: true })
  enactedEpoch: number | null;

  @Column({ name: 'dropped_epoch', type: 'integer', nullable: true })
  droppedEpoch: number | null;

  @Column({ name: 'expired_epoch', type: 'integer', nullable: true })
  expiredEpoch: number | null;

  @Column({ name: 'expiration_epoch', type: 'integer', nullable: true })
  expirationEpoch: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'block_time', type: 'timestamptz', nullable: true })
  blockTime: Date | null;
}
