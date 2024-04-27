import { Module } from '@nestjs/common';
import { DrepController } from './drep.controller';
import { DrepService } from './drep.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drep} from 'src/entities/drep.entity';
import { ConnectionService } from 'src/connection/conn.service';

@Module({
  imports:[TypeOrmModule.forFeature([Drep ])],
  controllers: [DrepController],
  providers:[DrepService, ConnectionService]
})
export class DrepModule {}
