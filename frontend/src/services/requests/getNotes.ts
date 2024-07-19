
import { StakeKeys } from '../../../types/commonTypes';
import axiosInstance from '../axiosInstance';

export const getNotes = async (stakeKeys?: StakeKeys) => {
  const response = await axiosInstance.get(`/api/notes/all`, {
    params: stakeKeys,
  });
  return response.data;
};
