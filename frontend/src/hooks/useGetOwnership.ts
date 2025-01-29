import { verifyOwnership } from '@/services/requests/verifyOwnership';
import { useQuery } from 'react-query';

export const useGetOwnership = ({ drepId, voterId }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ownership', { drepId, voterId }],
    queryFn: () => verifyOwnership({ drepId, voterId }),
    enabled: !!drepId && !!voterId,
    refetchOnWindowFocus: false,
  });

  return { isOwnershipLoading: isLoading, isError, ownership: data };
};
