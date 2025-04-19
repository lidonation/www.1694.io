import axiosInstance from '../axiosInstance';

export const getAllMetrics = async (search?: string, categories?: string[]) => {
  let queryParams = typeof  search != "undefined" ? `?s=${encodeURIComponent(search)}` : '';
  queryParams = typeof  categories != "undefined" ? `${queryParams}&category=${encodeURIComponent(categories.join(','))}` : '';
  const response = await axiosInstance.get(`metrics${queryParams}`);
  return response.data;
};