'use client';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { convertDrepPhraseToCIP105 } from '@/lib';
import { getDRepParticipation } from '@/services/requests/getDRepParticipation';
import { DRepParticipation } from '../../types/api';

export const useGetDRepParticipationQuery = (voterId: string) => {
  const { data, isLoading, error } = useQuery<DRepParticipation>({
    queryKey: [QUERY_KEYS.getDRepParticipationKey, voterId],
    queryFn: async () => {
      const cip105Id = convertDrepPhraseToCIP105(voterId);
      return await getDRepParticipation(cip105Id);
    },
    enabled: !!voterId,
    refetchOnWindowFocus: false,  });

  return {
    participationData: data,
    isParticipationDataLoading: isLoading,
    participationDataError: error,
  };
};
