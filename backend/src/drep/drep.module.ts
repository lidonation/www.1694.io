import { Module } from '@nestjs/common';
import { DrepController } from './drep.controller';
import { DrepService } from './drep.service';
import { CommentsService } from 'src/comments/comments.service';
import { ReactionsService } from 'src/reactions/reactions.service';
import { VoterService } from 'src/voter/voter.service';
import { AuthService } from 'src/auth/auth.service';
import { BlockfrostService } from 'src/blockfrost/blockfrost.service';
import { GovtoolsOAuthProvider } from 'src/auth/providers/govtools-oauth.provider';

@Module({
  controllers: [DrepController],
  providers: [
    DrepService,
    CommentsService,
    ReactionsService,
    VoterService,
    AuthService,
    GovtoolsOAuthProvider,
    BlockfrostService,
  ],
})
export class DrepModule {}
