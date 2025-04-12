// useGetActionsProposalsQuery.ts
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getActionsProposals } from '@/services/requests/getActionsProposals';

export const useGetActionsProposalsQuery = (
  page: number = 1,
  pageSize: number = 6
) => {
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.getActionsProposalsKey, page],
    queryFn: async () => await getActionsProposals(page, pageSize),
    enabled: true,
    refetchOnWindowFocus: false,
    keepPreviousData: true, 
  });

  return { 
    actionsProposals: data, 
    isActionsProposalsLoading: isLoading
  };
};