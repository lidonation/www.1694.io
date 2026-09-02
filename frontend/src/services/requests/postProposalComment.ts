import axiosInstance from '../axiosInstance';

export const postProposalComment = async (id: number, commentData: any) => {
  const response = await axiosInstance.post(
    `/actions-proposals/${id}/comments`,
    {
      data: commentData,
    },
  );
  return response.data;
};
