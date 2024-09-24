import { getVoterDataByIdentity } from '@/services/requests/getVoterDataByIdentity';
import { useQuery } from 'react-query';

export const useVoterDataByIdentityQuery = (
  voterIdentity: string ,
) => {
  const { data, isLoading } = useQuery({
    queryKey: ['voters', voterIdentity],
    queryFn: async () => await getVoterDataByIdentity({ voterIdentity }),
    enabled: !!voterIdentity,
    refetchOnWindowFocus: false,
  });

  return { voterData: data, isVoterDataLoading: isLoading };
};
