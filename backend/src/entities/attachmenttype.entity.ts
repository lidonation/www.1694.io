import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Attachment } from "./attachment.entity";

@Entity()
export class AttachmentType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string; // e.g., "link", "pdf", "jpg", "png"

  @OneToMany(() => Attachment, (attachment) => attachment.attachmentType)
  attachments: Attachment[];
}
