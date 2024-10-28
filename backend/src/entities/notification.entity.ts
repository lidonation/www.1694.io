import {  BaseImmutableEntity } from 'src/global';
import { Column, Entity,  PrimaryGeneratedColumn } from 'typeorm';


//for reference to the notifications   
@Entity() 
export class Notification extends BaseImmutableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({
    type: 'enum',
    enum: ['info', 'warning', 'error'],
    default: 'info',
  })
  type: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ default: false })
  isPersistent: boolean;

  @Column()
  recipient: string;
}
