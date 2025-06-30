import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Post,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CreateOAuthDto,
  UnifiedLoginDto,
  UpdateOAuthDto,
  VerifyDRepSignatureDto,
} from './auth.dto';
import { OAuthProviderType } from 'src/entities/oauth.entity';
import {
  verifySignature,
  verifySignatureFromLoginFile,
  verifyTxWitness,
} from 'src/utils/cardano-utils';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() payload: UnifiedLoginDto) {
    try {
      return this.authService.unifiedLogin(payload);
    } catch (error) {
      console.error('Login error:', error);
      throw new HttpException(
        error?.message || 'Login failed',
        error?.status || 500,
      );
    }
  }

  @Post('signatures/verify')
  async verifySignature(@Body() payload: VerifyDRepSignatureDto) {
    return verifySignature(payload);
  }

  @Post('login/verify-sigs')
  async verifySignatureFromLoginFile(
    @Body('payload')
    payload: Omit<VerifyDRepSignatureDto, 'address'>['signatures'],
  ) {
    return verifySignatureFromLoginFile(payload);
  }
  @Post('login/link-sigs-to-drep')
  async linkSignaturesToDRep(
    @Body('payload')
    payload: Omit<VerifyDRepSignatureDto, 'address'>['signatures'],
  ) {
    return verifySignatureFromLoginFile(payload);
  }

  @Post('witnesses/verify')
  async verifyWitness(
    @Body()
    payload: {
      witnessSet: {
        vkey: string;
        signature: string;
      };
      address: string;
    },
  ) {
    return verifyTxWitness(payload);
  }

  @Get('oauth/providers')
  async getOAuthProviders(
    @Query('stakeKeyBech32')
    stakeKeyBech32: string,
  ) {
    return this.authService.getOAuthProvidersByStakeKeyBech32(stakeKeyBech32);
  }

  @Get('oauth/provider')
  async getOAuthProvider(
    @Query('stakeKeyBech32')
    stakeKeyBech32: string,
    @Query('provider')
    provider: OAuthProviderType,
  ) {
    return this.authService.getOAuthProviderBy(provider, stakeKeyBech32);
  }

  @Get('oauth/provider/check')
  async getOAuthProviderCheck(
    @Query('stakeKeyBech32')
    stakeKeyBech32: string,
    @Query('provider')
    provider: OAuthProviderType,
  ) {
    return this.authService.getOAuthProviderCheck(stakeKeyBech32, provider);
  }

  @Post('oauth/add')
  async addOAuthProvider(@Body() addOAuthPayload: CreateOAuthDto) {
    return this.authService.addOAuthProvider(addOAuthPayload);
  }

  @Post('oauth/refresh')
  async initiateRefreshOAuth(
    @Body()
    refreshOAuthPayload: {
      stakeKeyBech32: string;
      provider: OAuthProviderType;
    },
  ) {
    return this.authService.refreshOAuthProvider(refreshOAuthPayload);
  }

  @Post('oauth/update')
  async updateOAuthProvider(@Body() updateOAuthPayload: UpdateOAuthDto) {
    return this.authService.updateOAuthProvider(updateOAuthPayload);
  }

  @Delete('oauth/delete')
  async deleteOAuthProvider(
    @Query('stakeKeyBech32')
    stakeKeyBech32: string,
    @Query('providerId')
    providerId: number,
  ) {
    return this.authService.deleteOAuthProvider(stakeKeyBech32, providerId);
  }
}
