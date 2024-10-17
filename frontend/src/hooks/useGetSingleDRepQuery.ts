import { QUERY_KEYS } from '@/constants/queryKeys';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { useQuery } from 'react-query';

export const useGetSingleDRepQuery = (drepId?: string) => {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: [QUERY_KEYS.getSingleDRepKey, drepId],
    queryFn: async () => await getSingleDRepViaVoterId(drepId),
    enabled: !!drepId,
    refetchOnWindowFocus: false,
  });

  return {
    dRep: data,
    isDRepLoading: isLoading,
    refetch,
    fetchError: error as any,
  };
};
