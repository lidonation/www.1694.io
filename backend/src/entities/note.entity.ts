import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Drep } from "./drep.entity";
import { Attachment } from "./attachment.entity";
import { Comment } from "./comment.entity";

@Entity()
export class Note {
  //auto increment primary key decorator
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  title: string;

  @Column({})
  tag: string;

  @Column({ nullable: false })
  text: string;

  @ManyToOne(() => Drep, (drep) => drep.notes)
  drep: Drep;

  @OneToMany(() => Comment, (comment) => comment.note)
  comments: Comment[];

//   @OneToMany()
//   reactions: string;

  @OneToMany(() => Attachment, (attachment) => attachment.notes)
  attachments: Attachment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
