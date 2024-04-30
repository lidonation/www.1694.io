import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AttachmentType } from './attachmenttype.entity';
import { Note } from './note.entity';

@Entity()
export class Attachment {
  //auto increment primary key decorator
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  url: string;

  @ManyToMany(() => Note, (note) => note.attachments)
  notes: Note[];

  @ManyToOne(
    () => AttachmentType,
    (attachmentType) => attachmentType.attachments,
  )
  attachmentType: AttachmentType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
