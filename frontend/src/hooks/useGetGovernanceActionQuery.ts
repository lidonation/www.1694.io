'use client';
import { useQuery } from 'react-query';
import { getGovernanceAction } from '@/services/requests/getGovernanceAction';
import { QUERY_KEYS } from '@/constants/queryKeys';

export const useGetGovernanceActionQuery = (id: string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.getGovernanceActionKey, id],
    queryFn: () => getGovernanceAction(id!),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  return { governanceAction: data ?? null, isLoading, error };
};
