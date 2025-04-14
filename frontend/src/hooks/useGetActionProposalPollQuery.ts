import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getActionProposalPoll } from '@/services/requests/getActionProposalPoll';

export const useGetActionProposalPollQuery = (id: number) => {
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.getActionProposalPollKey, id],
    queryFn: async () => await getActionProposalPoll(id),
    enabled: true,
    refetchOnWindowFocus: false,
  });

  return { poll: data, isPollLoading: isLoading };
};
