import { getCurrentNodeStatus } from '@/services/requests/getCurrentNodeStatus';
import { useQuery } from 'react-query';

export const useGetNodeStatusQuery = () => {
  const { data, isLoading, isFetching, isError, error , isSuccess} = useQuery({
    queryKey: 'nodeStatus',
    queryFn: async () => getCurrentNodeStatus(),
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
  });
  return {
    NodeStatus: data,
    isLoading,
    isFetching,
    isError: !isSuccess || isError,
    error,
  };
};
