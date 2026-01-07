import { Module } from '@nestjs/common';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Module({
  controllers: [ReactionsController],
  providers: [ReactionsService, NotificationsService],
})
export class ReactionsModule {}
