import { urls } from '@/constants';
import axiosInstance from '../axiosInstance';
import { getDataFromSession } from '@/lib';

export const getRefreshToken = async () => {
  try {
    const currentRefreshToken = typeof window !== 'undefined' && getDataFromSession('pdfUserJwt');

    const { data } = await axiosInstance.post(
      `${urls.pdfApiUrl}/token/refresh`,
      { refreshToken: currentRefreshToken },
      { withCredentials: true },
    );
    
    return data;
  } catch (error) {
    throw error;
  }
};
