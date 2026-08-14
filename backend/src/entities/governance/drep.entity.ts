import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('dreps')
@Index('idx_drep_id', ['drepId'], { unique: true })
@Index('idx_drep_hex', ['hex'])
@Index('idx_drep_active', ['active'])
@Index('idx_drep_retired', ['retired'])
@Index('idx_drep_expired', ['expired'])
@Index('idx_drep_active_epoch', ['lastActiveEpoch'])
@Index('idx_drep_voting_power', ['votingPowerAda'])
@Index('idx_drep_delegators', ['delegationVoteCount'])
@Index('idx_drep_claimed', ['isClaimed'])
export class Drep {
  @PrimaryColumn({ name: 'drep_id', type: 'text' })
  drepId: string;

  @Column({ name: 'hex', type: 'text' })
  hex: string;

  @Column({ name: 'amount_lovelace', type: 'bigint', nullable: true })
  amountLovelace: string | null;

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'active_epoch', type: 'integer', nullable: true })
  activeEpoch: number | null;

  @Column({ name: 'has_script', type: 'boolean', default: false })
  hasScript: boolean;

  @Column({ name: 'retired', type: 'boolean', default: false })
  retired: boolean;

  @Column({ name: 'expired', type: 'boolean', default: false })
  expired: boolean;

  @Column({ name: 'last_active_epoch', type: 'integer', nullable: true })
  lastActiveEpoch: number | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: any | null;

  @Column({
    name: 'voting_power_ada',
    type: 'decimal',
    precision: 30,
    scale: 6,
    nullable: true,
  })
  votingPowerAda: string | null;

  @Column({ name: 'delegation_vote_count', type: 'integer', default: 0 })
  delegationVoteCount: number;

  @Column({ name: 'governance_vote_count', type: 'integer', default: 0 })
  governanceVoteCount: number;

  @Column({ name: 'is_claimed', type: 'boolean', default: false })
  isClaimed: boolean;

  @Column({ name: 'voltaire_drep_id', type: 'integer', nullable: true })
  voltaireDrepId: number | null;

  @Column({ name: 'snapshot_epoch_no', type: 'integer', nullable: true })
  snapshotEpochNo: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
