import { Module } from "@nestjs/common";
import { DrepModule } from "./drep/drep.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import  { configCexplorer, configVoltaire } from "../ormconfig";
import { ConnectionService } from "./connection/connection.service";
import { NoteModule } from './note/note.module';
@Module({
  imports: [DrepModule,TypeOrmModule.forRoot(configCexplorer),TypeOrmModule.forRoot(configVoltaire), NoteModule],
  controllers: [],
  providers: [ConnectionService],
})
export class AppModule {}
