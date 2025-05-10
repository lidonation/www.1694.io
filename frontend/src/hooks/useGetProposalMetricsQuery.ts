import { getAllMetrics } from '@/services/requests/getProposalMetrics';
import { useQuery } from 'react-query';
import { ProposalMetrics } from '../../types/commonTypes';

export const useGetProposalMetricsQuery = (search?: string, categories?: string[], committees: string[] = []) => {
  const { data, isLoading } = useQuery<ProposalMetrics>({
    queryKey: ['proposalmetrics', search, categories, committees],
    queryFn: async () => await getAllMetrics(search, categories, committees),
    refetchOnWindowFocus: false,
  });

  return { proposalMetrics: data, isProposalMetricsLoading: isLoading };
};
