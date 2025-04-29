import axiosInstance from '../axiosInstance';

export interface VerifySignaturesPayloadRequest {
  signatures: {
    signature: string;
    vkey: string;
  };
  address: string;
}

export interface VerifySignaturesPayloadResponse {
  workMode: 'verify-cip30';
  payloadResultMatch: boolean;
  publicKeyHex: string;
  payloadDataHex: string;
  signature: string;
  publicKey: string;
  error?: string;
}

export const verifySignatures = async (
  payload: VerifySignaturesPayloadRequest,
) => {
  const response = await axiosInstance.post('auth/signatures/verify', payload);
  return response.data as VerifySignaturesPayloadResponse;
};
