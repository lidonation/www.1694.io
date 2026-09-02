import axios from 'axios';
import { urls } from '@/constants';
import { getDataFromSession } from '@/lib';
import { LOGIN_TOKEN_1694 } from '@/constants/storage';

const baseURL = urls.baseServerUrl;

const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
});

axiosInstance.interceptors.request.use((config) => {
  const authToken1694 =
    typeof window !== 'undefined' && getDataFromSession(LOGIN_TOKEN_1694);
  if (authToken1694) {
    config.headers['Authorization-1694'] = `Bearer ${authToken1694}`;
  }
  if (config.method !== 'get') {
    const token =
      typeof window !== 'undefined' && getDataFromSession('pdfUserJwt');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

//can also intercept to navigate to an error page
export const SetupInterceptors = () =>
  axiosInstance.interceptors.response.use(
    function (response) {
      return response;
    },
    function (error) {
      if (error?.response?.status === 500) {
        throw new Error(error?.response);
      }

      return Promise.reject(error);
    },
  );

export default axiosInstance;
