import { Module } from '@nestjs/common';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { VoterModule } from 'src/voter/voter.module';

@Module({
  imports: [VoterModule],
  controllers: [NoteController],
  providers: [NoteService, NotificationsService],
})
export class NoteModule {}
