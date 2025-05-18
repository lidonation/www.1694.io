export enum OAuthProviderType {
  GOVTOOLS = 'govtools',
}

export interface OAuthProvider {
  provider: OAuthProviderType;
  id: number;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  providerUserId?: string;
  stakeKeyBech32: string;
  metadata?: ExternalOAuthMetadata[OAuthProviderType];
}

export class CreateOAuthDto<T extends OAuthProviderType = OAuthProviderType> {
  provider: T;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  providerUserId?: string;
  stakeKeyBech32: string;
  metadata?: T extends keyof ExternalOAuthMetadata
    ? ExternalOAuthMetadata[T]
    : never;
}

export class UpdateOAuthDto<T extends OAuthProviderType = OAuthProviderType> {
  provider?: OAuthProviderType;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  providerUserId?: string;
  stakeKeyBech32?: string;
  metadata?: T extends keyof ExternalOAuthMetadata
    ? ExternalOAuthMetadata[T]
    : never;
}
export type ExternalOAuthMetadata = {
  [OAuthProviderType.GOVTOOLS]: GovToolsMetadata;
};
export type GovToolsMetadata = {
  keyType: 'stake' | 'drep';
};

export type GovToolsJwtPayload = {
  id: number;
  stakeKey: string;
  dRepID: string;
  iat: number;
  exp: number;
};
