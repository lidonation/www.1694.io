import { Module } from '@nestjs/common';
import { DrepController } from './drep.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drep } from 'src/entities/drep.entity';
import { ConnectionService } from 'src/connection/connection.service';
import { Attachment } from 'src/entities/attachment.entity';
import { DrepService } from './drep.service';
import { AttachmentService } from 'src/attachment/attachment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Drep, Attachment], 'web')],
  controllers: [DrepController],
  providers: [DrepService, ConnectionService, AttachmentService],
})
export class DrepModule {}
