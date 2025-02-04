import { convertDrepPhraseToCIP105 } from '@/lib';
import {
  verifyOwnership
} from '@/services/requests/verifyOwnership';
import { useQuery } from 'react-query';

interface UseGetOwnershipProps {
  drepId: string;
  voterId: string;
}

export const useGetOwnership = ({ drepId, voterId }: UseGetOwnershipProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ownership', drepId, voterId],
    queryFn: async () => {
      return verifyOwnership({
        drepId: convertDrepPhraseToCIP105(drepId),
        voterId: convertDrepPhraseToCIP105(voterId),
      });
    },
    enabled: Boolean(drepId) && Boolean(voterId),
    refetchOnWindowFocus: false,
  });

  return { isOwnershipLoading: isLoading, isError, ownership: data };
};
