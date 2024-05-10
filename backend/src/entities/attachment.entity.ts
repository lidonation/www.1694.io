import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Note } from './note.entity';
enum AttachmentTypeName {
  Link = 'link',
  PDF = 'pdf',
  JPG = 'jpg',
  PNG = 'png',
  WEBP = 'webp',
  GIF = 'gif',
  SVG = 'svg',
}


@Entity()
export class Attachment {
  //auto increment primary key decorator
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  url: string;

  @ManyToOne(() => Note, (note) => note.id)
  noteId: Note[];

  @Column({
    type: 'enum',
    enum: AttachmentTypeName,
    default: AttachmentTypeName.Link, // Set default value if needed
  })
  attachmentType: AttachmentTypeName;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
