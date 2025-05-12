import { StakeKeys } from '../../../types/commonTypes';
import axiosInstance from '../axiosInstance';

export const getDRepTimeline = async (
  idOrVoterId: string,
  stakeKey?: string,
  stakeKeyBech32?: string,
  startTimeCursor?: number,
  endTimeCursor?: number,
  filterValues?: string[] | undefined,
) => {
  const params: Record<string, any> = {
    stakeKey: stakeKey,
    stakeKeyBech32: stakeKeyBech32,
    startTimeCursor: startTimeCursor,
    endTimeCursor: endTimeCursor,
  };

  if (filterValues && filterValues.length > 0) {
    const processedFilterValues = filterValues.flatMap((value) =>
      value.includes(',') ? value.split(',') : value,
    );

    if (processedFilterValues.length > 0) {
      params.filterValues = processedFilterValues;
    }
  }

  const response = await axiosInstance.get(`/dreps/${idOrVoterId}/activity`, {
    params,
    paramsSerializer: (params) => {
      return new URLSearchParams(
        Object.entries(params).flatMap(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map((v) => [key, v]);
          }
          return [[key, value]];
        }),
      ).toString();
    },
  });
  return response.data;
};
