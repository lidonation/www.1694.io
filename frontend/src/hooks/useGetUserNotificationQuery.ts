'use client';
import { useQuery } from 'react-query';
import { getUserNotifications } from '@/services/requests/getUserNotifications';

export const useGetUserNotificationQuery = ({
  recipientId,
}: {
  recipientId: string;
}) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', recipientId],
    queryFn: async () => await getUserNotifications({ recipientId }),
    enabled: !!recipientId,
  });

  return { notifications: data, loading: isLoading, refetch };
};
