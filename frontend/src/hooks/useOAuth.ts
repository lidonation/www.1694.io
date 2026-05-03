'use client';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  CreateOAuthDto,
  OAuthProviderType,
  UpdateOAuthDto,
} from '@/models/oauth';
import {
  getOAuthProviders,
  getOAuthProvider,
  createOAuth,
  updateOAuth,
  deleteOAuth,
  getCheckOAuthProvider,
  initiateRefreshOAuth,
} from './../services/requests/oAuthQueries';

const OAUTH_KEYS = {
  all: ['oauth'] as const,
  providers: (stakeKeyBech32?: string) =>
    [...OAUTH_KEYS.all, 'providers', stakeKeyBech32] as const,
  provider: (stakeKeyBech32: string, provider: OAuthProviderType) =>
    [...OAUTH_KEYS.all, 'provider', stakeKeyBech32, provider] as const,
};

export const useGetOAuthProviders = (stakeKeyBech32?: string) => {
  return useQuery(
    OAUTH_KEYS.providers(stakeKeyBech32),
    () => getOAuthProviders({ stakeKeyBech32: stakeKeyBech32! }),
    {
      enabled: typeof window !== "undefined" && (!!stakeKeyBech32),
    },
  );
};

export const useGetOAuthProvider = (
  stakeKeyBech32: string,
  provider: OAuthProviderType,
) => {
  return useQuery(
    OAUTH_KEYS.provider(stakeKeyBech32, provider),
    () => getOAuthProvider({ stakeKeyBech32, provider }),
    {
      enabled: typeof window !== "undefined" && (!!stakeKeyBech32 && !!provider),
    },
  );
};

export const useCreateOAuth = () => {
  const queryClient = useQueryClient();

  return useMutation((payload: CreateOAuthDto) => createOAuth(payload), {
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(
        OAUTH_KEYS.providers(variables.stakeKeyBech32),
      );
      queryClient.invalidateQueries(
        OAUTH_KEYS.provider(variables.stakeKeyBech32, variables.provider),
      );
    },
    onError: (error) => {
      console.error('Error creating OAuth:', error);
      throw error;
    },
  });
};

export const useUpdateOAuth = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (payload: {
      data: UpdateOAuthDto;
      stakeKeyBech32: string;
      providerId: number;
    }) => updateOAuth(payload.data),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(
          OAUTH_KEYS.providers(variables.stakeKeyBech32),
        );
        if (variables.data.provider) {
          queryClient.invalidateQueries(
            OAUTH_KEYS.provider(
              variables.stakeKeyBech32,
              variables.data.provider,
            ),
          );
        }
      },
    },
  );
};

export const useDeleteOAuth = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({
      stakeKeyBech32,
      providerId,
    }: {
      stakeKeyBech32: string;
      providerId: number;
    }) => deleteOAuth({ stakeKeyBech32, providerId }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(
          OAUTH_KEYS.providers(variables.stakeKeyBech32),
        );
      },
    },
  );
};

export const useOAuth = (stakeKeyBech32?: string) => {
  const { data: oAuthProviders, isLoading: isLoadingOAuthProviders } =
    useGetOAuthProviders(stakeKeyBech32);

  const { mutateAsync: createOAuthAsync, isLoading: isCreatingOAuth } =
    useCreateOAuth();

  const { mutateAsync: updateOAuthAsync, isLoading: isUpdatingOAuth } =
    useUpdateOAuth();

  const { mutateAsync: deleteOAuthAsync, isLoading: isDeletingOAuth } =
    useDeleteOAuth();

  const handleUpdateOAuth = async (
    data: UpdateOAuthDto,
    providerId: number,
    stakeKeyBech32: string,
  ) => {
    return updateOAuthAsync({
      data,
      stakeKeyBech32,
      providerId,
    });
  };
  const handleCheckOAuthProvider = async (
    stakeKeyBech32: string,
    provider: OAuthProviderType,
  ) => {
    return getCheckOAuthProvider({
      stakeKeyBech32,
      provider,
    });
  };
  const handleRefreshOAuth = async (
    stakeKeyBech32: string,
    provider: OAuthProviderType,
  ) => {
    return initiateRefreshOAuth({
      stakeKeyBech32,
      provider,
    });
  };

  return {
    oAuthProviders,
    isLoadingOAuthProviders,
    createOAuth: createOAuthAsync,
    updateOAuth: handleUpdateOAuth,
    deleteOAuth: deleteOAuthAsync,
    handleCheckOAuthProvider,
    isCreatingOAuth,
    isUpdatingOAuth,
    isDeletingOAuth,
    handleRefreshOAuth,
  };
};
