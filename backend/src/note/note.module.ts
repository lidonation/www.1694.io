import { Module } from '@nestjs/common';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { DrepService } from 'src/drep/drep.service';
import { ReactionsService } from 'src/reactions/reactions.service';
import { CommentsService } from 'src/comments/comments.service';
import { VoterService } from 'src/voter/voter.service';
import { AuthService } from 'src/auth/auth.service';
import { BlockfrostService } from 'src/blockfrost/blockfrost.service';
import { GovtoolsOAuthProvider } from 'src/auth/providers/govtools-oauth.provider';

@Module({
  controllers: [NoteController],
  providers: [
    NoteService,
    DrepService,
    ReactionsService,
    CommentsService,
    VoterService,
    AuthService,
    BlockfrostService,
    GovtoolsOAuthProvider,
  ],
})
export class NoteModule {}
