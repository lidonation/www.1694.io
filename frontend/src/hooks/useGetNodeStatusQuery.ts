import { getCurrentNodeStatus } from '@/services/requests/getCurrentNodeStatus';
import { useQuery } from 'react-query';

export const useGetNodeStatusQuery = ({disablePolling=false}:{disablePolling:boolean}) => {
  const { data, isLoading, isFetching, isError, error , isSuccess, isFetchedAfterMount, refetch} = useQuery({
    queryKey: ['nodeStatus'],
    queryFn: getCurrentNodeStatus,
    refetchInterval: disablePolling ? false : 10000,
    refetchOnWindowFocus: false,
  });
  return {
    NodeStatus: data,
    refetch,
    isLoading,
    isFetching,
    isFetchedAfterMount,
    isError: !isSuccess || isError,
    error,
  };
};
