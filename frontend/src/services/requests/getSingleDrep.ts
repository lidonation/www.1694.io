
import { StakeKeys } from '../../../types/commonTypes';
import axiosInstance from '../axiosInstance';

export const getSingleDRep = async (drepid: number, stakeKeys?: StakeKeys) => {
  console.log("front", {stakeKeys})
  const response = await axiosInstance.get(`/api/dreps/${drepid}/drep`, {
    params: stakeKeys,
  });
  return response.data;
};
