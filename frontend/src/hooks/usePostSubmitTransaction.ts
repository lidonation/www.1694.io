'use client';
import { postSubmitTx } from '@/services/requests/postSubmitTx';
import { useMutation } from 'react-query';

export const usePostSubmitTransaction = () => {
  return useMutation(({ tx }: { tx: string }) => postSubmitTx(tx));
};
