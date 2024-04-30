import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  DeleteDateColumn,
} from "typeorm";
import { Drep } from "./drep.entity";
import { Attachment } from "./attachment.entity";
import { Comment } from "./comment.entity";
import { Reaction } from "./reaction.entity";

@Entity()
export class Note {
  //auto increment primary key decorator
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  note_title: string;

  @Column({})
  note_tag: string;

  @Column({ nullable: false })
  note_content: string;

  @ManyToOne(() => Drep, (drep) => drep.voter_id)
  voter: Drep;

  @OneToMany(() => Comment, (comment) => comment.note)
  comments: Comment[];

  @ManyToMany(() => Reaction, (reaction) => reaction.note)
  reactions: string;

  @ManyToMany(() => Attachment, (attachment) => attachment.notes)
  attachments: Attachment[];

  @Column()
  note_visibility:string

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({nullable:true})
  deletedAt: Date; 
}
