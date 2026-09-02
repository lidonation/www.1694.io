import { Entity, Column, PrimaryGeneratedColumn, Index, Unique } from 'typeorm';

@Entity('drep_epoch_stake')
@Unique('uq_drep_epoch_stake', ['drepId', 'epochNo'])
@Index('idx_drep_epoch_stake_epoch', ['epochNo'])
@Index('idx_drep_epoch_stake_active', ['active'])
export class DrepEpochStake {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: string;

  @Column({ name: 'drep_id', type: 'text' })
  drepId: string;

  @Column({ name: 'epoch_no', type: 'integer' })
  epochNo: number;

  @Column({ name: 'amount_lovelace', type: 'bigint' })
  amountLovelace: string;

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;

  @Column({
    name: 'snapshotted_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  snapshottedAt: Date;
}
