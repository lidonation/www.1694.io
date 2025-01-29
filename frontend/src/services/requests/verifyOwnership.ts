import axiosInstance from '../axiosInstance';

export interface VerifyOwnershipPayloadRequest {
  drepId: string;
  voterId: string;
}

export interface VerifyOwnershipPayloadResponse {
  result: boolean;
  message: string;
  signatures: {
    signature: string;
    key: string;
    type: 'drep' | 'signer';
  };
}
export const verifyOwnership = async (
  payload: VerifyOwnershipPayloadRequest,
) => {
  const response = await axiosInstance.get('dreps/verify-ownership', {
    params: payload,
  });
  return response.data as VerifyOwnershipPayloadResponse;
};
