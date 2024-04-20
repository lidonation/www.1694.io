import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Comment } from "./comment.entity";
import { Reaction } from "./reaction.entity";

@Entity()
export class Delegator{
  //delegator
  //auto increment primary key decorator
  @PrimaryGeneratedColumn()
  id: number;
  //Human readable name for the entity
  @Column({ unique: true, nullable: false })
  name: string;

  @Column({nullable:false})
  wallet_addr:string 
  //a delegator can have many comments
  @OneToMany(()=>Comment, comment=>comment.delegator)
  comments: Comment[];
  //a delegator can have many rxns but of different types
  @OneToMany(()=>Reaction, reaction=>reaction.delegator)
  reactions: Reaction[];

  //timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
