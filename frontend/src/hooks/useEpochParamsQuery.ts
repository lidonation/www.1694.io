'use client';
import { useQuery } from 'react-query';
import getEpochParams from '@/services/requests/getEpochParams';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { EpochParams } from '@/lib/governanceThresholds';

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export const useEpochParamsQuery = () => {
  const { data, isLoading } = useQuery<EpochParams>({
    queryKey: [QUERY_KEYS.getEpochParamsKey],
    queryFn: getEpochParams,
    staleTime: FIVE_DAYS_MS,
    refetchOnWindowFocus: false,
  });

  return { epochParams: data ?? null, isEpochParamsLoading: isLoading };
};
