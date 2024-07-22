import { QUERY_KEYS } from '@/constants/queryKeys';
import { getDReps } from '@/services';
import { useQuery } from 'react-query';

export const useGetDRepsQuery = (s?: string, page?: number) => {
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.getAllDReps, s, page],
    queryFn: async () => await getDReps(s, page),
    refetchOnWindowFocus: false,
    enabled: true,
  });

  return { DReps: data, isDRepsLoading: isLoading };
};
