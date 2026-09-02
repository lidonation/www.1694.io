import { BaseImmutableEntity } from '../global';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

//for reference to the notifications
@Entity()
export class Notification extends BaseImmutableEntity {
  declare id: number;

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

  declare createdAt: Date;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isArchived: boolean;

  declare deletedAt: Date;

  @Column({ default: false })
  isPersistent: boolean;

  @Column({ nullable: true })
  recipient: string;
}
