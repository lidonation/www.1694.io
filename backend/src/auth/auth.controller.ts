import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CreateOAuthDto,
  UpdateOAuthDto,
  VerifyDRepSignatureDto,
} from './auth.dto';
import { OAuthProviderType } from 'src/entities/oauth.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('session')
  async getSession(@Body('payload') payload: any) {
    return this.authService.getSession(payload);
  }

  @Post('login')
  async login(@Body() payload: any) {
    const { expiry, ...authPayload } = payload;
    return this.authService.login(authPayload, expiry);
  }

  @Post('signatures/verify')
  async verifySignature(@Body() payload: VerifyDRepSignatureDto) {
    return this.authService.verifySignature(payload);
  }

  @Post('login/verify-sigs')
  async verifySignatureFromLoginFile(
    @Body('payload')
    payload: Omit<VerifyDRepSignatureDto, 'address'>['signatures'],
  ) {
    return this.authService.verifySignatureFromLoginFile(payload);
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
    return this.authService.verifyTxWitness(payload);
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
