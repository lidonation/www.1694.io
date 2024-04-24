import { Module } from "@nestjs/common";
import { DrepModule } from "./drep/drep.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import  { configCexplorer, configVoltaire } from "../ormconfig";
@Module({
  imports: [DrepModule, TypeOrmModule.forRoot(configCexplorer)],
  controllers: [],
  providers: [],
})
export class AppModule {}
