import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Notification } from 'src/entities/notification.entity';
import { DataSource, In, Repository } from 'typeorm';

@Injectable()
export class NotificationRepository extends Repository<Notification> {
  constructor(
    @InjectDataSource('default')
    private dataSource: DataSource,
  ) {
    super(Notification, dataSource.createEntityManager());
  }

  async findByRecipient(ownerId: string) {
    return this.createQueryBuilder('notification')
      .where('notification.recipient = :ownerId', { ownerId })
      .getMany();
  }

  async createNotification(notificationData: any) {
    const notification = this.create(notificationData);
    return this.save(notification);
  }

  async findById(id: string) {
    return this.findOne({ where: { id: Number(id) } });
  }

  async findByIds(ids: string[]) {
    return this.findBy({ id: In(ids) });
  }

  async markAsRead(id: string) {
    return this.update(id, { isRead: true });
  }

  async markAsUnread(id: string) {
    return this.update(id, { isRead: false });
  }

  async bulkDelete(ids: string[]) {
    return this.delete({ id: In(ids) });
  }

  async findOlderThan(days: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.createQueryBuilder('notification')
      .where('notification.createdAt < :cutoffDate', { cutoffDate })
      .getMany();
  }
}
