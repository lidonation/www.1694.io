import { urls } from '@/constants';
import axiosInstance from '../axiosInstance';

export const getDRepVotingPowerList = async (identifiers: string[]) => {
  const params = new URLSearchParams();
  identifiers.forEach((id: string) => params.append('identifiers', id));

  console.log(urls.govToolApiUrl);
  
  const response = await axiosInstance.get(
    `/drep/voting-power-list?${params.toString()}`,
    { baseURL: urls.govToolApiUrl },
  );

  return response.data || [];
};
