import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { createNotificationDto } from 'src/dto/createNotificationDto';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationService: NotificationsService) {}
  @Get('/:recipientId/all')
  async getNotifications(@Param('recipientId') recipientId: string) {
    return this.notificationService.getNotifications(recipientId);
  }
  @Post('/:recipientId/new')
  async createNotification(
    @Param('recipientId') recipientId: string,
    @Body() content: createNotificationDto,
  ) {
    return this.notificationService.createNotification(
      content,
      Number(recipientId),
    );
  }
  @Post('/:notificationId/read')
  async markNotificationAsRead(
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.markNotificationAsRead(notificationId);
  }
  @Post('/:notificationId/unread')
  async markNotificationAsUnread(
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.markNotificationAsUnread(notificationId);
  }
}
