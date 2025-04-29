import axiosInstance from '../axiosInstance';

export interface VerifyLoginFileSigsPayloadRequest {
  signature: string;
  vkey: string;
}

export interface VerifyLoginFileSigsPayloadResponse {
  workMode: 'verify-cip30';
  payloadResultMatch: boolean;
  publicKeyHex: string;
  payloadDataHex: string;
  signature: string;
  publicKey: string;
  error?: string;
}

export const verifyLoginFileSigs = async (
  payload: VerifyLoginFileSigsPayloadRequest,
) => {
  const response = await axiosInstance.post('auth/login/verify-sigs', {payload});
  return response.data as VerifyLoginFileSigsPayloadResponse;
};
