import axiosInstance from '../axiosInstance';
type Payload = {
  stakeKey: string;
  signature: string;
  key: string;
};
export const getSession = async ({ payload }: { payload: Payload }) => {
  const response = await axiosInstance.get('auth/session', {
    data: payload,
  });
  return response.data;
};
