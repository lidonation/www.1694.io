'use client';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { convertDrepPhraseToCIP105 } from '@/lib';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { useQuery } from 'react-query';

export const useGetSingleDRepQuery = (drepId?: string) => {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: [QUERY_KEYS.getSingleDRepKey, drepId],
    queryFn: async () => {
      const cip105Id = convertDrepPhraseToCIP105(drepId);
      return await getSingleDRepViaVoterId(cip105Id);
    },
    enabled: typeof window !== 'undefined' && !!drepId,
    refetchOnWindowFocus: false,
  });

  return {
    dRep: data,
    isDRepLoading: isLoading,
    refetch,
    fetchError: error as any,
  };
};
