import {getAllMetrics} from '../services/requests/getProposalMetrics';
import {useQuery} from 'react-query';
import {ProposalMetrics} from '../../types/commonTypes';

export const useGetProposalMetricsQuery = () => {
  const { data, isLoading } = useQuery<ProposalMetrics>({
    queryKey: ['proposalmetrics'],
    queryFn: async () => await getAllMetrics(),
    refetchOnWindowFocus: false,
  });

  return { proposalMetrics: data, isProposalMetricsLoading: isLoading };
};
