import { Module } from '@nestjs/common';
import { DrepModule } from './drep/drep.module';
import { NoteModule } from './note/note.module';
import { AttachmentModule } from './attachment/attachment.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DbModule } from './db.module';
import { HealthzModule } from './healthz/healthz.module';
import { AuthModule } from './auth/auth.module';
import { VoterModule } from './voter/voter.module';
import { CommentsModule } from './comments/comments.module';
import { ReactionsModule } from './reactions/reactions.module';
import { ProposalsModule } from './proposals/proposals.module';
import { MiscellaneousModule } from './miscellaneous/miscellaneous.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BlockfrostModule } from './blockfrost/blockfrost.module';
import { ActionsProposalsModule } from './actions-proposals/actions-proposals.module';
import { MetricsModule } from './proposal-metrics/metrics-module';
import { QueueModule } from './queue/queue.module';
import { HttpModule } from '@nestjs/axios';
import { RepositoryModule } from './repository/repository.module';
import { IpfsModule } from './ipfs/ipfs.module';
import { JwtModule } from '@nestjs/jwt';

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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'secretKey'),
        signOptions: { expiresIn: '1d' },
        global: true,
      }),
    }),
    DbModule,
    RepositoryModule,
    DrepModule,
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
    IpfsModule,
    ActionsProposalsModule,
    MetricsModule,
    QueueModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
