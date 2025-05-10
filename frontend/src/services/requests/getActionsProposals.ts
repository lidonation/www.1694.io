import axiosInstance from '../axiosInstance';

export const getActionsProposals = async (
  page: number = 1,
  pageSize: number = 12,
  search: string = '',
  category: string[] = [],
  committee: string[] = [],
  sortBy: string = 'updatedAt',
  sortOrder: string = 'desc',
) => {
  const params: any = {
    page,
    pageSize,
    s: search,
    sortBy,
    sortOrder,
  };

  if (category.length > 0) {
    params.category = category.join(',');
  }

  if (committee.length > 0) {
    params.committee = committee.join(',');
  }

  const response = await axiosInstance.get('/actions-proposals', {
    params,
  });
  return response.data;
};