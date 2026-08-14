'use client';
import { getProposalMetadataByHash } from '@/services/requests/getProposalMetadataByHash';
import { useQuery } from 'react-query';
export type getProposalMetadataByHashQueryStringProps = {
  hashQueryString: string;
  isRequired?: boolean;
};
export const useGetProposalMetadataByHashQuery = ({
  hashQueryString,
  isRequired = true,
}: getProposalMetadataByHashQueryStringProps) => {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['getProposalMetadataByHashQueryString', hashQueryString],
    queryFn: async () => await getProposalMetadataByHash(hashQueryString),
    enabled: typeof window !== 'undefined' && !!hashQueryString && isRequired,
    refetchOnWindowFocus: false,
  });

  return {
    proposalMetadata: data,
    isProposalMetadataLoading: isLoading,
    isProposalMetadataFetching: isFetching,
    proposalMetadataFetchError: error as any,
  };
};
