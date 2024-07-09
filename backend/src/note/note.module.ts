import { Module } from '@nestjs/common';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from 'src/entities/note.entity';
import { AttachmentService } from 'src/attachment/attachment.service';
import { DrepService } from 'src/drep/drep.service';
import { ReactionsService } from 'src/reactions/reactions.service';
import { CommentsService } from 'src/comments/comments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Note])],
  controllers: [NoteController],
  providers: [NoteService, AttachmentService, DrepService, ReactionsService, CommentsService],
})
export class NoteModule {}
