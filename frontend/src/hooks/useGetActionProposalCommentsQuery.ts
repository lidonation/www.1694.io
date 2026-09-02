'use client';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getActionProposalComments } from '@/services/requests/getActionProposalComments';

export const useGetActionProposalCommentsQuery = (id: number) => {
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.getActionProposalCommentsKey, id],
    queryFn: async () => await getActionProposalComments(id),
    enabled: typeof window !== 'undefined',
    refetchOnWindowFocus: false,
  });

  return { comments: data, isCommentsLoading: isLoading };
};
