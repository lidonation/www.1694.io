import { UnifiedLoginDto } from '../../../types/auth';
import axiosInstance from '../axiosInstance';

interface UserLoginResponse {
  access_token: string;
  user: {
    stakeKey: string;
    key: string;
    signature: string;
    loginMethod: string;
  };
}
export const userLogin = async (payload: UnifiedLoginDto) => {
  const response = await axiosInstance.post('/auth/login', payload);
  return response.data as UserLoginResponse;
};
