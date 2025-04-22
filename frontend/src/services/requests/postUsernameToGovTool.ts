import { urls } from '@/constants';
import axiosInstance from '../axiosInstance';

export const postUsernameToGovTool = async (userNameData: any) => {
  try {
    const { data } = await axiosInstance.put(`${urls.pdfApiUrl}/users/edit`, {
      ...userNameData,
    });
    return data;
  } catch (error) {
    console.error(error);
    throw error
  }
};
