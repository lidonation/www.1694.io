import {
  IsDate,
  IsEnum,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { OAuthProviderType } from 'src/entities/oauth.entity';

export class VerifyDRepSignatureDto {
  signatures: {
    vkey: string;
    signature: string;
  };
  address: string; //can be drep or stake or payment address
}

export class CreateOAuthDto {
  @IsNotEmpty()
  @IsEnum(OAuthProviderType)
  provider: OAuthProviderType;

  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsDate()
  expiresAt?: Date;

  @IsOptional()
  @IsJSON()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  providerUserId?: string;

  @IsString()
  stakeKeyBech32: string;
}
export class UpdateOAuthDto {
   @IsString()
  stakeKeyBech32: string;

  @IsOptional()
  @IsEnum(OAuthProviderType)
  provider?: OAuthProviderType;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsDate()
  expiresAt?: Date;

  @IsOptional()
  @IsString()
  providerUserId?: string;
}
