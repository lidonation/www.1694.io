import { QUERY_KEYS } from '@/constants/queryKeys';
import { useCardano } from '@/context/walletContext';
import { getSingleDRep } from '@/services/requests/getSingleDrep';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { useQuery } from 'react-query';
import { StakeKeys } from '../../types/commonTypes';

export const useGetSingleDRepQuery = (drepId) => {
  const { stakeKey, stakeKeyBech32 } = useCardano();
  const stakeKeys: StakeKeys = { stakeKey, stakeKeyBech32 };
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.getSingleDRepKey, stakeKey],
    queryFn: async () =>
      drepId.includes('drep')
        ? await getSingleDRepViaVoterId(drepId, stakeKeys)
        : await getSingleDRep(drepId, stakeKeys),
    enabled: !!drepId,
    refetchOnWindowFocus: false,
  });

  return { dRep: data, isDRepLoading: isLoading };
};
