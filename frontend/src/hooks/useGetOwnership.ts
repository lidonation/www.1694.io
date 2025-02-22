import { convertDrepPhraseToCIP105Legacy, isCip105 } from '@/lib';
import { verifyOwnership } from '@/services/requests/verifyOwnership';
import { useQuery } from 'react-query';

interface UseGetOwnershipProps {
  drepId: string;
  voterId: string;
}

export const useGetOwnership = ({ drepId, voterId }: UseGetOwnershipProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ownership', drepId, voterId],
    queryFn: async () => {
      const convertedDrepId = convertDrepPhraseToCIP105Legacy(drepId);
      const convertedVoterId = convertDrepPhraseToCIP105Legacy(voterId);
      if (
        !convertedDrepId ||
        !convertedVoterId ||
        !isCip105(convertedDrepId) ||
        !isCip105(convertedVoterId)
      ) {
        return null;
      }
      return verifyOwnership({
        drepId: convertedDrepId,
        voterId: convertedVoterId,
      });
    },
    enabled: !!drepId && !!voterId,
    refetchOnWindowFocus: false,
  });

  return { isOwnershipLoading: isLoading, isError, ownership: data };
};
