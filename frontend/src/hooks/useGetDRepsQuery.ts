import { QUERY_KEYS } from '@/constants/queryKeys';
import { getDReps } from '@/services';
import { useQuery } from 'react-query';

export const useGetDRepsQuery = (
  s?: string,
  page?: number,
  sort?: string,
  order?: string,
  onChainStatus?: string,
  campaignStatus?: string,
) => {
  const { data, isLoading } = useQuery({
    queryKey: [
      QUERY_KEYS.getAllDReps,
      s,
      page,
      sort,
      order,
      onChainStatus,
      campaignStatus,
    ],
    queryFn: async () =>
      await getDReps(s, page, sort, order, onChainStatus, campaignStatus),
    refetchOnWindowFocus: false,
    enabled: true,
  });

  return { DReps: data, isDRepsLoading: isLoading };
};
