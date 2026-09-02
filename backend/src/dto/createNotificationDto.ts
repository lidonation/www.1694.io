enum NotificationType {
  info = 'info',
  warning = 'warning',
  error = 'error',
}

export class createNotificationDto {
  title: string;
  message: string;
  type: keyof typeof NotificationType;
  isRead?: boolean;
  isArchived?: boolean;
  isPersistent?: boolean;
}
