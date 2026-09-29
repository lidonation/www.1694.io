'use client';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getActionProposal } from '@/services/requests/getActionProposal';

export const useGetActionProposalQuery = (id: number) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [QUERY_KEYS.getActionProposalKey, id],
    queryFn: async () => await getActionProposal(id),
    // Keep the server render and first client render in the same loading state.
    enabled: !!id,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    actionProposal: data,
    isActionProposalLoading: isLoading,
    isActionProposalError: isError,
  };
};
