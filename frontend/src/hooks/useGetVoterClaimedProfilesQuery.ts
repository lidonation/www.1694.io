import { QUERY_KEYS } from '@/constants/queryKeys';
import { convertDrepPhraseToCIP105 } from '@/lib';
import { getVoterClaimedProfiles } from '@/services/requests/getVoterClaimedProfiles';
import { useQuery } from 'react-query';

export const useGetVoterClaimedProfilesQuery = (drepId?: string) => {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: [QUERY_KEYS.getVoterClaimedProfilesKey, drepId],
    queryFn: async () => {
      const cip105Id = convertDrepPhraseToCIP105(drepId);
      return await getVoterClaimedProfiles(cip105Id);
    },
    enabled: !!drepId,
    refetchOnWindowFocus: false,
  });

  return {
    claimedProfiles: data,
    isClaimedProfilesLoading: isLoading,
    refetch,
    fetchError: error as any,
  };
};
