import { QUERY_KEYS } from '@/constants/queryKeys';
import { useCardano } from '@/context/walletContext';
import { getNotes } from '@/services/requests/getNotes';
import { useQuery } from 'react-query';
import { StakeKeys } from '../../types/commonTypes';

export const useGetNotesQuery = () => {
  const { stakeKey, stakeKeyBech32 } = useCardano();
  const stakeKeys: StakeKeys = { stakeKey, stakeKeyBech32 };

  const { data, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEYS.getNotesKey, stakeKeys],
    queryFn: async () => await getNotes(stakeKeys),
    refetchOnWindowFocus: false,
    enabled: true,
  });

  return { Notes: data, isNotesLoading: isLoading, refetch };
};
