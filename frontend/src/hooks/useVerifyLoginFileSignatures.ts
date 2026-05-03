'use client';
import {
  verifyLoginFileSigs,
  VerifyLoginFileSigsPayloadRequest,
} from '@/services/requests/verifyLoginFileSigs';
import { useMutation } from 'react-query';

export const useVerifyLoginFileSignatures = () => {
  const { data, isLoading, isError, mutateAsync } = useMutation(
    async ({ signature, vkey }: VerifyLoginFileSigsPayloadRequest) => {
      return await verifyLoginFileSigs({
        signature,
        vkey,
      });
    },
  );

  return {
    isVerifying: isLoading,
    isError,
    loginVerification: data,
    verifyLoginFileSigs: mutateAsync,
  };
};
