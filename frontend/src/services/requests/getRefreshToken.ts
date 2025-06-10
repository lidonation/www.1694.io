import { urls } from '@/constants';
import axiosInstance from '../axiosInstance';

interface RefreshTokenRequest {
  jwt: string;
  refreshToken: string;
}

interface RefreshTokenResponse extends RefreshTokenRequest {}

export const getRefreshToken = async ({
  jwt,
  refreshToken,
}: RefreshTokenRequest) => {
  try {
    const { data } = await axiosInstance.post<RefreshTokenResponse>(
      `${urls.pdfApiUrl}/token/refresh`,
      { jwt, refreshToken },
      { withCredentials: true },
    );

    return data;
  } catch (error) {
    throw error;
  }
};
