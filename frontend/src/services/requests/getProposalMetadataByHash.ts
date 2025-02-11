import axiosInstance from '../axiosInstance';

export const getProposalMetadataByHash = async (hash: string) => {
  const response = await axiosInstance.get(`misc/proposal/${hash}`);
  return response.data;
};
 