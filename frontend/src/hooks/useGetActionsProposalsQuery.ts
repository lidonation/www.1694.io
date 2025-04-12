import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getActionsProposals } from '@/services/requests/getActionsProposals';

export const useGetActionsProposalsQuery = (
  
) => {
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.getActionsProposalsKey],
    queryFn: async () => await getActionsProposals(),
    enabled: true,
    refetchOnWindowFocus: false,
  });

  return { actionsProposals: data, isActionsProposalsLoading: isLoading};
};
