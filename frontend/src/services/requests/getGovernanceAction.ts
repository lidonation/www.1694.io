import axiosInstance from '../axiosInstance';

export const getGovernanceAction = async (id: string) => {
  const response = await axiosInstance.get(`proposals/${encodeURIComponent(id)}`);
  return response.data;
};
