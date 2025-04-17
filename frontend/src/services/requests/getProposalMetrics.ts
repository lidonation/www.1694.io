import axiosInstance from '../axiosInstance';

export const getAllMetrics = async (search?: string) => {
  let queryParams = typeof  search != "undefined" ? `?s=${encodeURIComponent(search)}` : '';

  const response = await axiosInstance.get(`metrics${queryParams}`);
  return response.data;
};