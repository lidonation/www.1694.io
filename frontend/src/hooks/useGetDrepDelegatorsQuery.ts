import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { Delegators } from '../../types/api';
import { getDrepDelegators } from '@/services/requests/getDrepDelegators';
import { convertDrepPhraseToCIP105 } from '@/lib';

export const useGetDrepDelegators = (
  voterId: string,
  page?: number,
  perPage?: number,
  sort?: string,
  order?: string,
) => {
  const { data, isLoading } = useQuery<Delegators>({
    queryKey: [QUERY_KEYS.getDrepDelegators, voterId, page, sort, order],
    queryFn: async () => {
      const cip105Id = convertDrepPhraseToCIP105(voterId);
      return await getDrepDelegators(cip105Id, page, perPage, sort, order);
    },
    enabled: !!voterId,
    refetchOnWindowFocus: false,
  });

  return { Delegators: data, isDelegatorsLoading: isLoading };
};
