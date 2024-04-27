import { Module } from '@nestjs/common';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from 'src/entities/note.entity';
import { ConnectionService } from 'src/connection/conn.service';

@Module({
  imports:[TypeOrmModule.forFeature([Note])],
  controllers: [NoteController],
  providers: [NoteService, ConnectionService]
})
export class NoteModule {}
