import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
export interface RefreshTokenRequest {
  jwt: string;
  refreshToken: string;
}
export interface RefreshTokenResponse {
  jwt: string;
  refreshToken: string;
}

@Injectable()
export class GovtoolsOAuthProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private get baseUrl(): string {
    return this.configService.get<string>('PDF_BASE_URL') || '';
  }

  private get refreshTokenUrl(): string {
    return `${this.baseUrl}/token/refresh`;
  }

  async refreshToken({ jwt, refreshToken }: RefreshTokenRequest) {
    try {
      const response = await lastValueFrom(
        this.httpService.post<RefreshTokenResponse>(
          this.refreshTokenUrl,
          { jwt, refreshToken },
          { withCredentials: true },
        ),
      );

      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }
}
