import { Entity, Column, PrimaryColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('drep_delegators')
@Index('idx_drep_delegator_composite', ['drepId', 'stakeAddress'], { unique: true })
@Index('idx_drep_delegator_drep', ['drepId'])
@Index('idx_drep_delegator_stake', ['stakeAddress'])
@Index('idx_drep_delegator_amount', ['amountLovelace'])
@Index('idx_drep_delegator_voting_power', ['votingPowerLovelace'])
export class DrepDelegator {
  @PrimaryColumn({ name: 'drep_id', type: 'text' })
  drepId: string; // Foreign key to dreps.drep_id

  @PrimaryColumn({ name: 'stake_address', type: 'text' })
  stakeAddress: string; // bech32 stake address

  @Column({ name: 'amount_lovelace', type: 'bigint' })
  amountLovelace: string; // currently delegated amount in lovelace

  @Column({ name: 'voting_power_lovelace', type: 'bigint', nullable: true })
  votingPowerLovelace: string | null; // actual voting power (controlled stake) in lovelace

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}