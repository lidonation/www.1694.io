import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Note } from "./note.entity";
import { Delegator } from "./delegator.entity";

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @ManyToOne(() => Note, note => note.comments)
  note: Note;

  @ManyToOne(() => Delegator, delegator => delegator.comments) // Many-to-One relationship with Delegator
  delegator: Delegator;

  @ManyToMany(() => Delegator)
  reactions: Delegator[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}