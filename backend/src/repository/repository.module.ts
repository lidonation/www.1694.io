import { Global, Module } from '@nestjs/common';
import { AttachmentRepository } from './voltaire/attachment.repository';
import { DRepRepository } from './voltaire/dRep.repository';
import { NoteRepository } from './voltaire/note.repository';
import { NotificationRepository } from './voltaire/notifications.repository';
import { OAuthRepository } from './voltaire/oAuth.repository';
import { ReactionRepository } from './voltaire/reactions.repository';
import { SignatureRepository } from './voltaire/signature.repository';
import { SynctimeRepository } from './voltaire/synctime.repository';
import { CommentRepository } from './voltaire/comment.repository';
import { BlockfrostModule } from '../blockfrost/blockfrost.module';

@Global()
@Module({
  imports: [BlockfrostModule],
  providers: [
    AttachmentRepository,
    DRepRepository,
    NoteRepository,
    CommentRepository,
    NotificationRepository,
    OAuthRepository,
    ReactionRepository,
    SignatureRepository,
    SynctimeRepository,
  ],
  exports: [
    AttachmentRepository,
    DRepRepository,
    NoteRepository,
    NotificationRepository,
    CommentRepository,
    OAuthRepository,
    ReactionRepository,
    SignatureRepository,
    SynctimeRepository,
  ],
})
export class RepositoryModule {}
