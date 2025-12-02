import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('drep_timeline_event')
@Index('idx_timeline_drep_ts', ['drepView', 'timestamp'])
@Index('idx_timeline_type', ['type'])
@Index('idx_timeline_epoch', ['epochNo'])
export class DrepTimelineEvent {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: string;

  @Column({ name: 'drep_view', type: 'text' })
  drepView: string;

  @Column({ name: 'drep_hash_id', type: 'bigint', nullable: true })
  drepHashId: string | null;

  @Column({ name: 'type', type: 'text' })
  type: 'epoch' | 'voting_activity' | 'delegation' | 'note' | 'registration' | 'claimed_profile';

  @Column({ name: 'timestamp', type: 'timestamptz' })
  timestamp: Date;

  @Column({ name: 'epoch_no', type: 'integer', nullable: true })
  epochNo: number | null;

  @Column({ name: 'payload', type: 'jsonb' })
  payload: any;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}