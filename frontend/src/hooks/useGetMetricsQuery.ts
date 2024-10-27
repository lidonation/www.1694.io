import { getMetrics } from '@/services/requests/getGeneralMetrics';
import { Metrics } from '../../types/commonTypes';
import { useQuery } from 'react-query';

export const useGetMetricsQuery = () => {
  const { data, isLoading } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: async () => await getMetrics(),
    refetchOnWindowFocus: false,
  });

  return { metrics: data, isMetricsLoading: isLoading };
};
