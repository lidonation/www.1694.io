import { Module } from '@nestjs/common';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { VoterService } from 'src/voter/voter.service';

@Module({
  controllers: [NoteController],
  providers: [NoteService, NotificationsService, VoterService],
})
export class NoteModule {}
