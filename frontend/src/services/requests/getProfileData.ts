import axiosInstance from '../axiosInstance';

export const getProfileData = async (stakeKey: string) => {
  const response = await axiosInstance.get(`dreps/${stakeKey}/profile-data`);
  return response.data;
};
