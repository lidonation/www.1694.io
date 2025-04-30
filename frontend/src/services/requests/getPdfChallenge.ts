import { urls } from '@/constants';
import axiosInstance from '../axiosInstance';

export const getPdfChallenge = async ({ query = '' }) => {
  try {
    const { data } = await axiosInstance.get(
      `${urls.pdfApiUrl}/auth/challenge${query}`,
      {
        withCredentials: true,
      },
    );
    return data;
  } catch (error) {
    throw error;
  }
};
