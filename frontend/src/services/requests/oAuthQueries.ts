import {
  CreateOAuthDto,
  OAuthProvider,
  OAuthProviderType,
  UpdateOAuthDto,
} from '@/models/oauth';
import axiosInstance from '../axiosInstance';

export const getOAuthProviders = async ({
  stakeKeyBech32,
}: {
  stakeKeyBech32: string;
}) => {
  const response = await axiosInstance.get(`auth/oauth/providers`, {
    params: {
      stakeKeyBech32,
    },
  });

  return response.data as OAuthProvider[];
};

export const getOAuthProvider = async ({
  stakeKeyBech32,
  provider,
}: {
  stakeKeyBech32: string;
  provider: OAuthProviderType;
}) => {
  const response = await axiosInstance.get('auth/oauth/provider', {
    params: {
      stakeKeyBech32,
      provider,
    },
  });

  return response.data;
};

export const getCheckOAuthProvider = async ({
  stakeKeyBech32,
  provider,
}: {
  stakeKeyBech32: string;
  provider: OAuthProviderType;
}) => {
  const response = await axiosInstance.get('auth/oauth/provider/check', {
    params: {
      stakeKeyBech32,
      provider,
    },
  });

  return response.data as { hasProvider: boolean };
};

export const createOAuth = async (payload: CreateOAuthDto) => {
  const response = await axiosInstance.post('auth/oauth/add', payload);

  return response.data;
};

export const updateOAuth = async (payload: UpdateOAuthDto) => {
  const response = await axiosInstance.put('auth/oauth/update', payload);

  return response.data;
};

export const initiateRefreshOAuth = async ({
  stakeKeyBech32,
  provider,
}: {
  stakeKeyBech32: string;
  provider: OAuthProviderType;
}) => {
  const response = await axiosInstance.post('auth/oauth/refresh', {
    stakeKeyBech32,
    provider,
  });

  return response.data;
};

export const deleteOAuth = async ({
  stakeKeyBech32,
  providerId,
}: {
  stakeKeyBech32: string;
  providerId: number;
}) => {
  const response = await axiosInstance.delete(`auth/oauth/delete`, {
    params: {
      stakeKeyBech32,
      providerId,
    },
  });

  return response.data;
};
