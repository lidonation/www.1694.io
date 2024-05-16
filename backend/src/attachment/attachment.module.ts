import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { ConnectionService } from 'src/connection/connection.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from 'src/entities/attachment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ Attachment])],
  controllers: [],
  providers: [AttachmentService, ConnectionService]
})
export class AttachmentModule {}
