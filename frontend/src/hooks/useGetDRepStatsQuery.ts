'use client';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getDRepStats } from '@/services/requests/getDRepStats';
import { DRepStats } from '../../types/api';
import { convertDrepPhraseToCIP105 } from '@/lib';

export const useGetDRepStatsQuery = (voterId: string) => {
  const { data, isLoading } = useQuery<DRepStats>({
    queryKey: [QUERY_KEYS.getDRepStatsKey, voterId],
    queryFn: async () => {
      const cip105Id = convertDrepPhraseToCIP105(voterId);
      return await getDRepStats(cip105Id);
    },
    enabled: typeof window !== "undefined" && (!!voterId),
    refetchOnWindowFocus: false,
  });

  return { DRepStats: data, isDRepStatsLoading: isLoading };
};
