import axiosInstance from '../axiosInstance';

export const getActionsProposals = async (
  page: number = 1,
  pageSize: number = 12,
  search: string = '',
  category: string = '',
  sortBy: string = 'createdAt',
  sortOrder: string = 'desc'
) => {
  const response = await axiosInstance.get('/actions-proposals', {
    params: {
      page,
      pageSize,
      search,
      category,
      sortBy,
      sortOrder
    },
  });
  return response.data;
};
