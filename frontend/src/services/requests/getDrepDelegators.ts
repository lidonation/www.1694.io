import axiosInstance from '../axiosInstance';

export const getDrepDelegators = async (
  voterId: string,
  page?: number,
  perPage?: number,
) => {
  const response = await axiosInstance.get(`dreps/${voterId}/delegators`, {
    params: { page, perPage },
  });
  return response.data;
};
