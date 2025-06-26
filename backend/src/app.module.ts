import { Module } from '@nestjs/common';
import { DrepModule } from './drep/drep.module';
import { NoteModule } from './note/note.module';
import { AttachmentModule } from './attachment/attachment.module';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db.module';
import { HealthzModule } from './healthz/healthz.module';
import { AuthModule } from './auth/auth.module';
import { VoterModule } from './voter/voter.module';
import { CommentsModule } from './comments/comments.module';
import { ReactionsModule } from './reactions/reactions.module';
import { AuthService } from './auth/auth.service';
import { ProposalsModule } from './proposals/proposals.module';
import { MiscellaneousModule } from './miscellaneous/miscellaneous.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BlockfrostModule } from './blockfrost/blockfrost.module';
import { ActionsProposalsModule } from './actions-proposals/actions-proposals.module';
import { MetricsModule } from './proposal-metrics/metrics-module';
import { QueueModule } from './queue/queue.module';
import { ReactionsService } from './reactions/reactions.service';
import { AttachmentService } from './attachment/attachment.service';
import { CommentsService } from './comments/comments.service';
import { HttpModule } from '@nestjs/axios';
import { BlockfrostService } from './blockfrost/blockfrost.service';
import { GovtoolsOAuthProvider } from './auth/providers/govtools-oauth.provider';
import { RepositoryModule } from './repository/repository.module';
import { IpfsModule } from './ipfs/ipfs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.production'],
    }),
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 5,
      global: true,
    }),
    DrepModule,
    DbModule,
    RepositoryModule,
    NoteModule,
    AttachmentModule,
    HealthzModule,
    AuthModule,
    VoterModule,
    CommentsModule,
    ReactionsModule,
    ProposalsModule,
    MiscellaneousModule,
    NotificationsModule,
    BlockfrostModule,
    ActionsProposalsModule,
    MetricsModule,
    QueueModule,
    IpfsModule,
  ],
  controllers: [],
  providers: [
    AuthService,
    ReactionsService,
    AttachmentService,
    CommentsService,
    BlockfrostService,
    GovtoolsOAuthProvider,
  ],
})
export class AppModule {}
