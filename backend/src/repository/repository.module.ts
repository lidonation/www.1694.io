import { Global, Module } from '@nestjs/common';
import { CardanoRepository } from './cardano/cardano.repository';
import { AttachmentRepository } from './voltaire/attachment.repository';
import { DRepRepository } from './voltaire/drep.repository';
import { NoteRepository } from './voltaire/note.repository';
import { NotificationRepository } from './voltaire/notifications.repository';
import { OAuthRepository } from './voltaire/oauth.repository';
import { ReactionRepository } from './voltaire/reactions.repository';
import { SignatureRepository } from './voltaire/signature.repository';
import { SynctimeRepository } from './voltaire/synctime.repository';
import { CommentRepository } from './voltaire/comment.repository';

@Global()
@Module({
  providers: [
    CardanoRepository,
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
    CardanoRepository,
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
