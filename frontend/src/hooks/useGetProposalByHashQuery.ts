import { getProposalByHashQueryString } from '@/services/requests/getProposalByHashQueryString';
import { useQuery } from 'react-query';
export type getProposalByHashQueryStringProps = {
  hashQueryString: string;
};
export const useGetProposalsQuery = ({
  hashQueryString,
}: getProposalByHashQueryStringProps) => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['getProposalByHashQueryString', hashQueryString],
    queryFn: async () => await getProposalByHashQueryString(hashQueryString),
    enabled: !!hashQueryString,
  });
  return {
    Proposals: data,
    isProposalsLoading: isLoading,
    isProposalsFetching: isFetching,
  };
};
