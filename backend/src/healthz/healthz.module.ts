import { Module } from '@nestjs/common';
import { ConnectionService } from 'src/connection/connection.service';
import { HealthzController } from './healthz.controller';

@Module({
  imports: [],
  controllers: [HealthzController],
  providers: [ConnectionService],
})
export class HealthzModule {}
