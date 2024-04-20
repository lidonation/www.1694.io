import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique,
} from "typeorm";
import { Delegator } from "./delegator.entity";

@Entity()
@Unique(["delegator", "type"]) // Ensures delegator cant like or thumbs up twice
export class Reaction {
  //auto increment primary key decorator
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  type: string; // all emojis

  @ManyToOne(() => Delegator, (delegator) => delegator.reactions) // Many-to-One relationship with Delegator
  delegator: Delegator;
  //timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
