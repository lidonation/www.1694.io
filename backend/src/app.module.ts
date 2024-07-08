import { Module } from '@nestjs/common';
import { DrepModule } from './drep/drep.module';
import { NoteModule } from './note/note.module';
import { AttachmentModule } from './attachment/attachment.module';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db.module';
import { HealthzModule } from './healthz/healthz.module';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { ReactionsModule } from './reactions/reactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.production'],
    }),
    DrepModule,
    DbModule,
    NoteModule,
    AttachmentModule,
    HealthzModule,
    AuthModule,
    CommentsModule,
    ReactionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
