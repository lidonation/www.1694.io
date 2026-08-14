import axiosInstance from '../axiosInstance';

export const getRelatedPaymentAddrFromStakeAddr = async (stakeAddr: string) => {
  const response = await axiosInstance.get(
    `/misc/stake-addr/${stakeAddr}/payment`,
  );
  return response.data as string[];
};
