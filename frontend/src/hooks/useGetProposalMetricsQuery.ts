import {getAllMetrics} from '@/services/requests/getProposalMetrics';
import {useQuery} from 'react-query';
import {ProposalMetrics} from '../../types/commonTypes';

export const useGetProposalMetricsQuery = (search: string) => {
  const { data, isLoading } = useQuery<ProposalMetrics>({
    queryKey: ['proposalmetrics', search],
    queryFn: async () => await getAllMetrics(search),
    refetchOnWindowFocus: false,
  });

  return { proposalMetrics: data, isProposalMetricsLoading: isLoading };
};
