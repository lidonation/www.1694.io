import axiosInstance from '../axiosInstance';

export const getDRepDelegators = async (
  voterId: string,
  page?: number,
  perPage?: number,
  sort?: string,
  order?: string,
) => {
  const response = await axiosInstance.get(`dreps/${voterId}/delegators`, {
    params: { page, perPage, sort, order },
  });
  return response.data;
};
