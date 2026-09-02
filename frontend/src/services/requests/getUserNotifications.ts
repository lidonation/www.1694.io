import { Notification } from '../../../types/commonTypes';
import axiosInstance from '../axiosInstance';

export const getUserNotifications = async ({
  recipientId,
}: {
  recipientId: string;
}) => {
  const response = await axiosInstance.get(`/notifications/${recipientId}/all`);
  return response.data as Notification[];
};
