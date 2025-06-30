import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { AttachmentController } from './attachment.controller';
import { IpfsService } from 'src/ipfs/ipfs.service';

@Module({
  controllers: [AttachmentController],
  providers: [AttachmentService, IpfsService],
})
export class AttachmentModule {}
