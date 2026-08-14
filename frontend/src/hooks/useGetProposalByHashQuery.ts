'use client';
import { getProposalByHashQueryString } from '@/services/requests/getProposalByHashQueryString';
import { useQuery } from 'react-query';
export type getProposalByHashQueryStringProps = {
  hashQueryString: string;
};
export const useGetProposalsQuery = ({
  hashQueryString,
}: getProposalByHashQueryStringProps) => {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['getProposalByHashQueryString', hashQueryString],
    queryFn: async () => await getProposalByHashQueryString(hashQueryString),
    enabled: typeof window !== 'undefined' && !!hashQueryString,
    refetchOnWindowFocus: false,
  });
  return {
    Proposals: data,
    isProposalsLoading: isLoading,
    isProposalsFetching: isFetching,
    proposalFetchError: error as any,
  };
};
