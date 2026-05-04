import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('sync_state')
export class SyncState {
  @PrimaryColumn()
  key: string;

  @Column({ name: 'last_processed_id', type: 'bigint', default: '0' })
  lastProcessedId: string;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
