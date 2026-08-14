'use client';

import {
  verifySignatures,
  VerifySignaturesPayloadRequest,
} from '@/services/requests/verifySignatures';
import { useMutation } from 'react-query';

export const useVerifySignatures = () => {
  const { data, isLoading, isError, mutateAsync } = useMutation(
    async ({ address, signatures }: VerifySignaturesPayloadRequest) => {
      return await verifySignatures({
        address,
        signatures,
      });
    },
  );

  return {
    isVerifying: isLoading,
    isError,
    verificationResult: data,
    verifySignatures: mutateAsync,
  };
};
