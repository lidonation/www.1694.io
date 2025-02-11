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
    enabled: !!hashQueryString && isRequired,
    refetchOnWindowFocus: false,
  });

  return {
    Proposal: data,
    isProposalLoading: isLoading,
    isProposalFetching: isFetching,
    proposalFetchError: error as any,
  };
};
