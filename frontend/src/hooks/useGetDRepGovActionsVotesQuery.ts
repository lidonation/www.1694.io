'use client';
import { useQuery } from 'react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { getDRepGovActionsVotes } from '@/services/requests/getDRepGovActionsVotes';
import { convertDrepPhraseToCIP105 } from '@/lib';

export const useGetDRepGovActionsVotesQuery = (
  voterId: string,
  page?: number,
  perPage?: number,
) => {
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.getDRepGovActionsVotesKey, voterId, page],
    queryFn: async () => {
      const cip105Id = convertDrepPhraseToCIP105(voterId);
      return await getDRepGovActionsVotes(cip105Id, page, perPage);
    },
    enabled: typeof window !== 'undefined' && !!voterId,
    refetchOnWindowFocus: false,
  });

  return { govActions: data, isGovActionsLoading: isLoading };
};
