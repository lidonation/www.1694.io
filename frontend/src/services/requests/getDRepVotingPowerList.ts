import axiosInstance from '../axiosInstance';

export const getDRepVotingPowerList = async (identifiers: string[]) => {
  const params = new URLSearchParams();
  identifiers.forEach((id: string) => params.append('identifiers', id));

  const response = await axiosInstance.get(
    `/dreps/voting-power-list?${params.toString()}`,
  );

  return response.data || [];
};
