import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('drep_timeline_event')
@Index('idx_drep_timeline_type', ['eventType'])
@Index('idx_drep_timeline_timestamp', ['timestamp'])
@Index('idx_drep_timeline_epoch', ['epoch'])
@Index('idx_drep_timeline_tx_hash', ['txHash'])
@Index('idx_drep_timeline_drep_id', ['drepId'])
@Index('idx_drep_timeline_drep_timeline', ['drepId', 'timestamp'])
export class DrepTimelineEvent {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: string;

  @Column({ name: 'event_type', type: 'text' })
  eventType: 'registration' | 'retirement' | 'delegation' | 'undelegation' | 'proposal' | 'vote';

  @Column({ name: 'timestamp', type: 'timestamptz' })
  timestamp: Date;

  @Column({ name: 'epoch', type: 'integer' })
  epoch: number;

  @Column({ name: 'slot', type: 'bigint' })
  slot: string;

  @Column({ name: 'tx_hash', type: 'text' })
  txHash: string;

  @Column({ name: 'block_hash', type: 'text', nullable: true })
  blockHash: string | null;

  @Column({ name: 'drep_id', type: 'text', nullable: true })
  drepId: string | null;

  @Column({ name: 'metadata', type: 'jsonb' })
  metadata: any;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
