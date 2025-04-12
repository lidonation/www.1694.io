import axiosInstance from '../axiosInstance';

export const getActionsProposals = async () => {
  const response = await axiosInstance.get(`/actions-proposals`);
  return response.data;
};