import {
  verifyWitnessSet,
  WitnessSetPayloadRequest,
} from '@/services/requests/verifyWitnessSet';
import { useMutation } from 'react-query';

export const useVerifyTransactionWitness = () => {
  const { data, isLoading, isError, mutateAsync } = useMutation(
    async ({ witnessSet, address }: WitnessSetPayloadRequest) => {
      return await verifyWitnessSet({
        witnessSet,
        address,
      });
    },
  );

  return { isWitnessVerifying: isLoading, isError, witnessVerification: data, verifyWitness: mutateAsync };
};
