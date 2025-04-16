import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getUserProposalVote } from '@/services/requests/getUserProposalVote';

export const useGetUserProposalVoteQuery = (pollId: string, dRepId: string) => {
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.getUserProposalVoteKey, dRepId, pollId],
    queryFn: async () => await getUserProposalVote(pollId, dRepId),
    enabled: !!pollId && !!dRepId,
    refetchOnWindowFocus: false,
  });

  return { pollVote: data, isPollVoteLoading: isLoading };
};