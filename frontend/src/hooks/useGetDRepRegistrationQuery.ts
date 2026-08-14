'use client';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getDRepRegStatus } from '@/services/requests/getDRepRegStatus';

export const useGetDRepRegistrationQuery = (dRepId: string) => {
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.getDRepRegStatusKey, dRepId],
    queryFn: async () => await getDRepRegStatus(dRepId),
    enabled: typeof window !== 'undefined' && !!dRepId,
    refetchOnWindowFocus: false,
  });

  return { registration: data, isRegistrationLoading: isLoading };
};
