import { compareDRepIDs } from '@/lib';
import {
  verifyOwnership,
  VerifyOwnershipPayloadResponse,
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
      if (!drepId || !voterId) {
        return {
          result: false,
          message: 'DREP ID or Voter ID not provided',
        } as VerifyOwnershipPayloadResponse;
      }

      if (compareDRepIDs(drepId, voterId)) {
        return {
          result: true,
          message: '',
        } as VerifyOwnershipPayloadResponse;
      }

      return verifyOwnership({ drepId, voterId });
    },
    enabled: Boolean(drepId) && Boolean(voterId),
    refetchOnWindowFocus: false,
  });

  return { isOwnershipLoading: isLoading, isError, ownership: data };
};