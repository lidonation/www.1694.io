import { urls } from '@/constants';
import axiosInstance from '../axiosInstance';


export const getRefreshToken = async () => {
  try {
    const { data } = await axiosInstance.post(
      `${urls.pdfApiUrl}/token/refresh`,
      {},
      { withCredentials: true },
    );

    return data;
  } catch (error) {
    throw error;
  }
};
