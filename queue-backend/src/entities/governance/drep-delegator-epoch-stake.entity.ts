import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('drep_delegator_epoch_stake')
@Index('idx_drep_delegator_epoch_drep_epoch', ['drepId', 'epochNo'])
@Index('idx_drep_delegator_epoch_stake_epoch', ['stakeAddress', 'epochNo'])
export class DrepDelegatorEpochStake {
  @PrimaryColumn({ name: 'drep_id', type: 'text' })
  drepId: string;

  @PrimaryColumn({ name: 'stake_address', type: 'text' })
  stakeAddress: string;

  @PrimaryColumn({ name: 'epoch_no', type: 'integer' })
  epochNo: number;

  @Column({ name: 'amount_lovelace', type: 'bigint' })
  amountLovelace: string;
}
