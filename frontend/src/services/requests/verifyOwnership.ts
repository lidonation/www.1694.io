import axiosInstance from '../axiosInstance';

export interface VerifyOwnershipPayloadRequest {
  drepId: string;
  voterId: string;
}
export type SignatureType = 'drep' | 'signer';
export interface VerifyOwnershipPayloadResponse {
  result: boolean;
  message: string;
  signatures: {
    signature: string,
    key: string,
    type: SignatureType,
  }[];
}

export const verifyOwnership = async (
  payload: VerifyOwnershipPayloadRequest,
) => {
  const response = await axiosInstance.get('dreps/verify-ownership', {
    params: payload,
  });
  return response.data as VerifyOwnershipPayloadResponse;
};
