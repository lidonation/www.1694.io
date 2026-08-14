'use client';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { getNotes } from '@/services/requests/getNotes';
import { useQuery } from 'react-query';
import { StakeKeys } from '../../types/commonTypes';
import { useWallet } from '@/context/globalContext';

type GetNotesProps = {
  currentNote?: number;
  request?: string;
};
export const useGetNotesQuery = ({
  currentNote,
  request,
}: GetNotesProps = {}) => {
  const {
    wallet: { stakeKey, stakeKeyBech32 },
  } = useWallet();
  const stakeKeys: StakeKeys = { stakeKey, stakeKeyBech32 };
  const { data, isLoading, refetch, isFetching, isPreviousData } = useQuery({
    queryKey: [QUERY_KEYS.getNotesKey, stakeKeys, currentNote, request],
    queryFn: async () => await getNotes(stakeKeys, currentNote, request),
    refetchOnWindowFocus: false,
    enabled: typeof window !== 'undefined',
    keepPreviousData: true,
  });
  return {
    Notes: data,
    isNotesLoading: isLoading,
    refetch,
    isNotesFetching: isFetching,
    isPreviousData,
  };
};
