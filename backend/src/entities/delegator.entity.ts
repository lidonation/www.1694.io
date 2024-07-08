import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

//drep or voter, for reference only
@Entity()
export class Delegator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  voter_id: string;
}
