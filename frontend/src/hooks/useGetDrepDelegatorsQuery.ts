import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { Delegators } from '../../types/api';
import { getDrepDelegators } from '@/services/requests/getDrepDelegators';

export const useGetDrepDelegators = (
  voterId: string,
  page?: number,
  perPage?: number,
) => {
  const { data, isLoading } = useQuery<Delegators>({
    queryKey: [QUERY_KEYS.getDrepDelegators, voterId, page],
    queryFn: async () => await getDrepDelegators(voterId, page, perPage),
    enabled: !!voterId,
    refetchOnWindowFocus: false,
  });

  return { Delegators: data, isDelegatorsLoading: isLoading };
};
