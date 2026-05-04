'use client';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { dRepPhraseProcessor } from '@/lib';
import { getDReps } from '@/services';
import { useQuery } from 'react-query';

export const useGetDRepsQuery = (
  s?: string,
  page?: number,
  sort?: string,
  order?: string,
  onChainStatus?: string,
  campaignStatus?: string,
  includeRetired?: string,
  type?: string,
) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      QUERY_KEYS.getAllDRepsKey,
      s,
      page,
      sort,
      order,
      onChainStatus,
      campaignStatus,
      includeRetired,
      type,
    ],
    queryFn: async () => {
      const searchPhrase = dRepPhraseProcessor(s);
      return await getDReps(
        searchPhrase,
        page,
        sort,
        order,
        onChainStatus,
        campaignStatus,
        includeRetired,
        type,
      );
    },
    refetchOnWindowFocus: false,
    enabled: typeof window !== "undefined",
  });

  return { DReps: data, isDRepsLoading: isLoading, isError };
};
