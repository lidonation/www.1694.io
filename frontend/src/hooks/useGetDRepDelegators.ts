'use client';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { Delegators } from '../../types/api';
import { convertDrepPhraseToCIP105 } from '@/lib';
import { getDRepDelegators } from '@/services/requests/getDRepDelegatorsList';

export const useGetDRepDelegatorsQuery = (
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
      return await getDRepDelegators(cip105Id, page, perPage, sort, order);
    },
    enabled: typeof window !== 'undefined' && !!voterId,
    refetchOnWindowFocus: false,
  });

  return { Delegators: data, isDelegatorsLoading: isLoading };
};
