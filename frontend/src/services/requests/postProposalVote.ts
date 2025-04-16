import axiosInstance from '../axiosInstance';

export const postProposalVote = async (voteData: any) => {
  const response = await axiosInstance.post(`/actions-proposals/poll/votes`, {
    data: voteData,
  });
  return response.data;
};
