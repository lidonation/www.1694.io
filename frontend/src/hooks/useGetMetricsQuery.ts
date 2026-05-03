'use client';
import { getMetrics } from '@/services/requests/getGeneralMetrics';
import { Metrics } from '../../types/commonTypes';
import { useQuery } from 'react-query';

export const useGetMetricsQuery = () => {
  const { data, isLoading } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: async () => await getMetrics(),
    refetchOnWindowFocus: false,
    enabled: typeof window !== 'undefined',
  });

  return { metrics: data, isMetricsLoading: isLoading };
};
