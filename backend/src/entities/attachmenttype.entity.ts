import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Attachment } from "./attachment.entity";

enum AttachmentTypeName {
  Link = "link",
  PDF = "pdf",
  JPG = "jpg",
  PNG = "png",
  WEBP = "webp",
  GIF = "gif"
}

@Entity()
export class AttachmentType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: AttachmentTypeName,
    default: AttachmentTypeName.Link // Set default value if needed
  })
  name: AttachmentTypeName;

  @OneToMany(() => Attachment, (attachment) => attachment.attachmentType)
  attachments: Attachment[];
}
