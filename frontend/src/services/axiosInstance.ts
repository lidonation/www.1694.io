import axios from 'axios';
import { urls } from '@/constants';
import { getDataFromSession } from '@/lib';

const baseURL = urls.baseServerUrl;
console.log(baseURL);

const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
});

axiosInstance.interceptors.request.use((config) => {
  if (config.method !== 'get') {
    const token = typeof window !== 'undefined' && getDataFromSession('pdfUserJwt');
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
