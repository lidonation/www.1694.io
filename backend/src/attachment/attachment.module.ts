import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from 'src/entities/attachment.entity';
import { AttachmentController } from './attachment.controller';
import { BlockfrostService } from 'src/blockfrost/blockfrost.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
  ],
  controllers: [AttachmentController],
  providers: [AttachmentService, BlockfrostService],
})
export class AttachmentModule {}
