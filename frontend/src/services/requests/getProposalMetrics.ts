import axiosInstance from '../axiosInstance';

export const getAllMetrics = async (
  search?: string,
  categories?: string[],
  committees?: string[],
) => {
  let queryParams = '';

  if (search) queryParams += `s=${encodeURIComponent(search)}`;
  if (categories?.length)
    queryParams += `${queryParams ? '&' : ''}category=${encodeURIComponent(categories.join(','))}`;
  if (committees?.length)
    queryParams += `${queryParams ? '&' : ''}committee=${encodeURIComponent(committees.join(','))}`;

  const response = await axiosInstance.get(
    `metrics${queryParams ? `?${queryParams}` : ''}`,
  );
  return response.data;
};
