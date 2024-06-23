import axiosInstance from '../axiosInstance';

export const getSingleDRepViaVoterIdDetails = async (voterid: string) => {
  const response = await axiosInstance.get(`/api/dreps/${voterid}/voter/details`);
  return response.data;
};
