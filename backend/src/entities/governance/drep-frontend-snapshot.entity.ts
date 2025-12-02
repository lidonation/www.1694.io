import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('drep_frontend_snapshot')
@Index('idx_drep_snapshot_view', ['view'], { unique: true })
@Index('idx_drep_snapshot_active', ['active'])
@Index('idx_drep_snapshot_retired', ['retired'])
@Index('idx_drep_snapshot_is_claimed', ['isClaimed'])
@Index('idx_drep_snapshot_type', ['drepType'])
@Index('idx_drep_snapshot_voting_power', ['votingPowerAda'], { unique: false })
@Index('idx_drep_snapshot_live_stake', ['liveStakeAda'], { unique: false })
@Index('idx_drep_snapshot_delegators', ['delegationVoteCount'], { unique: false })
@Index('idx_drep_snapshot_votes', ['governanceVoteCount'], { unique: false })
export class DrepFrontendSnapshot {
  @PrimaryColumn({ name: 'drep_hash_id', type: 'bigint' })
  drepHashId: string;

  @Column({ name: 'view', type: 'text' })
  view: string;

  @Column({ name: 'chain_id', type: 'text' })
  chainId: string;

  @Column({ name: 'cip129_id', type: 'text' })
  cip129Id: string;

  @Column({ name: 'has_script', type: 'boolean' })
  hasScript: boolean;

  @Column({ name: 'drep_type', type: 'text' })
  drepType: 'drep' | 'scripted' | 'voting_option';

  @Column({ name: 'active', type: 'boolean' })
  active: boolean;

  @Column({ name: 'retired', type: 'boolean' })
  retired: boolean;

  @Column({ name: 'is_registered_as_sole_voter', type: 'boolean', default: false })
  isRegisteredAsSoleVoter: boolean;

  @Column({ name: 'voting_power_ada', type: 'decimal', precision: 30, scale: 6 })
  votingPowerAda: string;

  @Column({ name: 'live_stake_ada', type: 'decimal', precision: 30, scale: 6, nullable: true })
  liveStakeAda: string | null;

  @Column({ name: 'delegation_vote_count', type: 'integer', default: 0 })
  delegationVoteCount: number;

  @Column({ name: 'governance_vote_count', type: 'integer', default: 0 })
  governanceVoteCount: number;

  @Column({ name: 'given_name', type: 'text', nullable: true })
  givenName: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'metadata_url', type: 'text', nullable: true })
  metadataUrl: string | null;

  @Column({ name: 'stake_address', type: 'text', nullable: true })
  stakeAddress: string | null;

  @Column({ name: 'reg_address', type: 'text', nullable: true })
  regAddress: string | null;

  @Column({ name: 'is_claimed', type: 'boolean', default: false })
  isClaimed: boolean;

  @Column({ name: 'voltaire_drep_id', type: 'integer', nullable: true })
  voltaireDrepId: number | null;

  @Column({ name: 'snapshot_epoch_no', type: 'integer', nullable: true })
  snapshotEpochNo: number | null;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}