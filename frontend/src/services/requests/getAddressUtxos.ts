import { StandardizedUTXO } from '../../../types/api';
import axiosInstance from '../axiosInstance';

export const getAddressUtxos = async (address: string) => {
  const response = await axiosInstance.get(`/misc/address/${address}/utxos`);
  return response.data as StandardizedUTXO[];
};
