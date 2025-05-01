import axiosInstance from '../axiosInstance';

export interface WitnessSetPayloadRequest {
  witnessSet: {
    signature: string;
    vkey: string;
  };
  address: string;
}

export interface WitnessSetPayloadResponse {
  workMode: string;
  publicKeyHex: string;
  publicKeyMatch: boolean;
  addressHex: string;
  signature: string;
  witnessSetHex: string;
  error?: string;
}
export const verifyWitnessSet = async (payload: WitnessSetPayloadRequest) => {
  const response = await axiosInstance.post('auth/witnesses/verify', payload);
  return response.data as WitnessSetPayloadResponse;
};
