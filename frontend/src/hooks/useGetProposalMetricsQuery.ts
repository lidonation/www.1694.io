import {getAllMetrics} from '@/services/requests/getProposalMetrics';
import {useQuery} from 'react-query';
import {ProposalMetrics} from '../../types/commonTypes';

export const useGetProposalMetricsQuery = (search?: string, categories?: string[]) => {
  const { data, isLoading } = useQuery<ProposalMetrics>({
    queryKey: ['proposalmetrics', search, categories],
    queryFn: async () => await getAllMetrics(search, categories),
    refetchOnWindowFocus: false,
  });

  return { proposalMetrics: data, isProposalMetricsLoading: isLoading };
};
