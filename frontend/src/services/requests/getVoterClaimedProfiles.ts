import { ClaimedProfile } from '../../../types/api';
import axiosInstance from '../axiosInstance';

export const getVoterClaimedProfiles = async (voterId: string) => {
  const response = await axiosInstance.get(
    `/dreps/${voterId}/claimed-profiles`,
  );
  return response.data as ClaimedProfile[];
};
