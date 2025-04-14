import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getActionsProposals } from '@/services/requests/getActionsProposals';

export const useGetActionsProposalsQuery = (
  page = 1,
  pageSize = 12,
  search = '',
  category = '',
  sortBy = 'createdAt',
  sortOrder = 'desc'
) => {
  const { data, isLoading } = useQuery({
    queryKey: [
      QUERY_KEYS.getActionsProposalsKey,
      page,
      pageSize,
      search,
      category,
      sortBy,
      sortOrder,
    ],
    queryFn: async () =>
      await getActionsProposals(
        page,
        pageSize,
        search,
        category,
        sortBy,
        sortOrder
      ),
    enabled: true,
    refetchOnWindowFocus: false,
    keepPreviousData: true
  });

  return {
    actionsProposals: data,
    isActionsProposalsLoading: isLoading
  };
};