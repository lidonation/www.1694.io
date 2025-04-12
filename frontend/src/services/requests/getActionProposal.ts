import axiosInstance from '../axiosInstance';

export const getActionProposal = async (id: number) => {
  const response = await axiosInstance.get(`/actions-proposals/${id}`);
  return response.data;
};