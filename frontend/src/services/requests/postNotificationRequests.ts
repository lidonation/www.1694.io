import axiosInstance from '../axiosInstance';

export const postCreateNotification = async ({
  recipientId,
  title,
  message,
  type,
  isRead,
  isArchived,
  isPersistent,
}: {
  recipientId: string;
  title: string;
  message: string;
  type: string;
  isRead?: boolean;
  isArchived?: boolean;
  isPersistent?: boolean;
}) => {
  const response = await axiosInstance.post(`/notifications/${recipientId}/new`, {
    title,
    message,
    type,
    isRead,
    isArchived,
    isPersistent,
  });
  return response.data;
};


export const postMarkNotificationAsRead = async ({
  notificationId,
}: {
  notificationId: string;
}) => {
  const response = await axiosInstance.post(
    `/notifications/${notificationId}/read`,
  );
  return response.data;
};


export const postMarkNotificationAsUnread = async ({
  notificationId,
}: {
  notificationId: string;
}) => {
  const response = await axiosInstance.post(
    `/notifications/${notificationId}/unread`,
  );
  return response.data;
};
