import axiosInstance from '../axiosInstance';

export const getActionProposalComments = async (id: number) => {
  const response = await axiosInstance.get(`/actions-proposals/${id}/comments`);
  return response.data;
};
