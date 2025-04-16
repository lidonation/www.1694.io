import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getActionProposal } from '@/services/requests/getActionProposal';

export const useGetActionProposalQuery = (id: number) => {
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.getActionProposalKey, id],
    queryFn: async () => await getActionProposal(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  return { actionProposal: data, isActionProposalLoading: isLoading };
};
