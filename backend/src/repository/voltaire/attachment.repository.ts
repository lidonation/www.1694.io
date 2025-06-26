import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Attachment } from 'src/entities/attachment.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class AttachmentRepository extends Repository<Attachment> {
  constructor(
    @InjectDataSource('default')
    private dataSource: DataSource,
  ) {
    super(Attachment, dataSource.createEntityManager());
  }

  async createAttachment(attachment: Partial<Attachment>): Promise<Attachment> {
    const newAttachment = this.create(attachment);
    return this.save(newAttachment);
  }
}
