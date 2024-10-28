import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'src/entities/notification.entity';
import { Synctime } from 'src/entities/synctime.entity';

@Global()
@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Notification, Synctime])],
  exports: [NotificationsService],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
