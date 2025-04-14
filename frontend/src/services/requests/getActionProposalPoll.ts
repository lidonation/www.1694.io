import axiosInstance from '../axiosInstance';

export const getActionProposalPoll = async (id: number) => {
  const response = await axiosInstance.get(`/actions-proposals/${id}/polls`);
  return response.data;
};