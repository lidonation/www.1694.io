
import { StakeKeys } from '../../../types/commonTypes';
import axiosInstance from '../axiosInstance';

export const getSingleDRepViaVoterId = async (
  voterid: string,
  stakeKeys?: StakeKeys
) => {
  const response = await axiosInstance.get(`/api/dreps/${voterid}/voter`, {
    params: stakeKeys,
  });
  return response.data;
};
