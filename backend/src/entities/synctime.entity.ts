import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Synctime {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lastSyncTime: string;
}
