import { Module } from '@nestjs/common';
import { DrepModule } from './drep/drep.module';
import { ConnectionService } from './connection/connection.service';
import { NoteModule } from './note/note.module';
import { AttachmentModule } from './attachment/attachment.module';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '../db.module';

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
  ],
  controllers: [],
  providers: [ConnectionService],
})
export class AppModule {}
