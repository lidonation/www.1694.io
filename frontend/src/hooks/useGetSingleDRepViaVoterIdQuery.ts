import { QUERY_KEYS } from '@/constants/queryKeys';
import { SingleDRep } from '@/models/api';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { useQuery } from 'react-query';

export const useGetSingleDRepViaVoterIdQuery = (
  voterId: string | undefined,
) => {
  const { data, isLoading } = useQuery<SingleDRep>({
    queryKey: [QUERY_KEYS.getSingleDRepViaVoterIdKey],
    queryFn: async () => await getSingleDRepViaVoterId(voterId),
    enabled: !!voterId,
    refetchOnWindowFocus: true,
  });

  return { DRep: data, isDRepLoading: isLoading };
};
