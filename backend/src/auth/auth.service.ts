import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GovtoolsOAuthProvider } from './providers/govtools-oauth.provider';
import {
  CreateOAuthDto,
  JwtPayload,
  LoginMethod,
  UnifiedLoginDto,
  UpdateOAuthDto,
} from './auth.dto';
import { OAuthProviderType } from 'src/entities/oauth.entity';
import {
  convertKeyAndSignatureToCbor,
  isCBORFormat,
  verifySignature,
  verifySignatureWithSignedMessage,
} from 'src/utils/cardano-utils';
import { SignatureRepository } from 'src/repository/voltaire/signature.repository';
import { OAuthRepository } from 'src/repository/voltaire/oAuth.repository';
import { DRepRepository } from 'src/repository/voltaire/dRep.repository';
import { QueueService } from 'src/queue/queue.service';
import { DRepClaimJobData, Queues, JobTypes } from 'src/queue/queue.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly signatureRepository: SignatureRepository,
    private readonly drepRepository: DRepRepository,
    private readonly oAuthRepository: OAuthRepository,
    private readonly govtoolsOAuthProvider: GovtoolsOAuthProvider,
    private readonly queueService: QueueService,
  ) {}

  private async signJWT(payload: JwtPayload, tte: number | string) {
    return this.jwtService.signAsync(payload, {
      expiresIn: tte,
    });
  }

  async unifiedLogin(loginDto: UnifiedLoginDto) {
    try {
      let verificationResult;

      switch (loginDto.method) {
        case LoginMethod.HOT_WALLET:
          verificationResult = await this.verifyHotWalletSignature(loginDto);
          break;

        case LoginMethod.LOGIN_FILE:
          verificationResult = await this.verifyLoginFileSignature(loginDto);
          break;

        default:
          throw new HttpException(
            'Invalid login method',
            HttpStatus.BAD_REQUEST,
          );
      }

      if (!verificationResult.payloadResultMatch) {
        throw new HttpException(
          'Signature verification failed',
          HttpStatus.UNAUTHORIZED,
        );
      }
      // Check DRep claim status (deliberately fire-and-forget). The promise is
      // explicitly voided and its rejection handled so a failure here can never
      // surface as an unhandled rejection and take the process down.
      void this.checkDRepClaimStatus(
        loginDto.stakeKey,
        loginDto.signature,
        loginDto.signatureKey,
      ).catch((error) => {
        Logger.error('Background DRep claim status check failed', error);
      });
      return await this.createJWTSession(loginDto);
    } catch (error) {
      console.error('Unified login error:', error);
      throw new HttpException(
        error.message || 'Login failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(currentUser: any) {
    const jwtPayload: JwtPayload = {
      sub: currentUser?.id,
      stakeKey: currentUser.stakeKey,
      signatureKey: currentUser.signatureKey,
    };

    const accessToken = await this.signJWT(jwtPayload, '24h');

    return {
      access_token: accessToken,
      expiresIn: '24h',
    };
  }

  /**
   * Verify signatures from hot wallets (CIP-30)
   */
  private async verifyHotWalletSignature(loginDto: UnifiedLoginDto) {
    const { signature, signatureKey, stakeKey } = loginDto;

    try {
      let cborSignature = signature;
      let cborKey = signatureKey;

      if (!isCBORFormat(signature)) {
        const converted = convertKeyAndSignatureToCbor(
          signatureKey,
          signature,
          stakeKey, // Use stakeKey as address for hot wallet
        );
        cborSignature = converted.signature;
        cborKey = converted.vkey;
      }

      const result = await verifySignature({
        address: stakeKey,
        signatures: {
          vkey: cborKey,
          signature: cborSignature,
        },
      });

      const messageUsed = 'Please verify your identity';
      // Verify payload
      const messageResult = verifySignatureWithSignedMessage({
        signatureCbor: loginDto.signature,
        message: messageUsed,
      });

      return {
        payloadResultMatch:
          messageResult.payloadResultMatch && result.payloadResultMatch,
      };
    } catch (error) {
      console.error('Hot wallet verification failed:', error);
      throw new HttpException(
        `Hot wallet signature verification failed: ${error.message}`,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Verify signatures from login files
   */
  private async verifyLoginFileSignature(loginDto: UnifiedLoginDto) {
    if (!loginDto.address) {
      throw new HttpException(
        'Address is required for login file verification',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Use utility function with address validation
      return await verifySignature({
        signatures: {
          vkey: loginDto.signatureKey,
          signature: loginDto.signature,
        },
        address: loginDto.address,
      });
    } catch (error) {
      console.error('Login file verification failed:', error);
      throw new HttpException(
        `Login file signature verification failed: ${error.message}`,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private async checkDRepClaimStatus(
    stakeKey: string,
    signature: string,
    key: string,
  ) {
    try {
      if (!stakeKey) {
        return {
          claimed: false,
          message: 'Stake key is required to check DRep claim status.',
        };
      }

      const dRep = await this.drepRepository.checkDRepClaimStatus(stakeKey);

      if (dRep) {
        return {
          claimed: true,
          drepId: dRep.id,
          drepBech32: dRep.signatures[0].drep_bech32,
          voterId: dRep.signatures[0].voterId,
        };
      }

      await this.queueService.addToQueue<DRepClaimJobData>(Queues.DREP_CLAIM, {
        name: JobTypes.DREP_CLAIM,
        data: {
          stakeKey,
          signature,
          signatureKey: key,
        },
      });

      return {
        claimed: false,
        message: 'DRep claim job has been queued successfully.',
      };
    } catch (error) {
      console.error('Error checking DRep claim status:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal Server Error',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create JWT session after successful verification
   */
  private async createJWTSession(loginDto: UnifiedLoginDto) {
    const signatureRecord =
      await this.signatureRepository.findByStakeKeyAndSignatureKey(
        loginDto.stakeKey,
        loginDto.signatureKey,
      );

    const jwtPayload: JwtPayload = {
      sub: signatureRecord?.id,
      stakeKey: loginDto.stakeKey,
      signatureKey: loginDto.signatureKey,
    };

    const accessToken = await this.signJWT(jwtPayload, '24h');

    return {
      access_token: accessToken,
      user: {
        stakeKey: loginDto.stakeKey,
        key: loginDto.signatureKey,
        signature: loginDto.signature,
        loginMethod: loginDto.method,
      },
    };
  }

  async addOAuthProvider(addOAuthPayload: CreateOAuthDto) {
    try {
      const existingOAuth =
        await this.oAuthRepository.findByProviderAndStakeKey(
          addOAuthPayload.provider,
          addOAuthPayload.stakeKeyBech32,
        );

      if (existingOAuth) {
        if (!existingOAuth.id) {
          throw new HttpException(
            'OAuth provider ID not found',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        const updatedOAuth = await this.oAuthRepository.updateOAuth(
          existingOAuth.id,
          addOAuthPayload,
        );
        return {
          id: updatedOAuth.id,
          provider: updatedOAuth.provider,
        };
      }

      const savedOAuth =
        await this.oAuthRepository.createOAuth(addOAuthPayload);
      return {
        id: savedOAuth.id,
        provider: savedOAuth.provider,
      };
    } catch (error) {
      console.error('Error adding OAuth provider:', error);
      throw new HttpException(
        error.message || 'Error adding OAuth provider',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getOAuthProvidersByStakeKeyBech32(stakeKeyBech32: string) {
    return this.oAuthRepository.findByStakeKey(stakeKeyBech32);
  }

  async getOAuthProviderCheck(
    stakeKeyBech32: string,
    provider: OAuthProviderType,
  ) {
    const oAuthProvider = await this.oAuthRepository.findByProviderAndStakeKey(
      provider,
      stakeKeyBech32,
    );
    return {
      hasProvider: !!oAuthProvider,
    };
  }

  async getOAuthProviderBy(
    provider: OAuthProviderType,
    stakeKeyBech32: string,
  ) {
    const oAuthProvider = await this.oAuthRepository.findByProviderAndStakeKey(
      provider,
      stakeKeyBech32,
    );
    if (!oAuthProvider) {
      throw new HttpException('OAuth provider not found', HttpStatus.NOT_FOUND);
    }
    return {
      id: oAuthProvider.id,
      provider: oAuthProvider.provider,
      stakeKeyBech32: oAuthProvider.stakeKeyBech32,
      accessToken: oAuthProvider.accessToken,
      createdAt: oAuthProvider.createdAt,
      updatedAt: oAuthProvider.updatedAt,
    };
  }

  async refreshOAuthProvider({
    stakeKeyBech32,
    provider,
  }: {
    stakeKeyBech32: string;
    provider: OAuthProviderType;
  }) {
    if (!stakeKeyBech32 || !provider) {
      throw new HttpException(
        'Stake Key Bech32 and Provider are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const oAuthProvider = await this.oAuthRepository.findByProviderAndStakeKey(
      provider,
      stakeKeyBech32,
    );
    if (!oAuthProvider) {
      throw new HttpException('OAuth provider not found', HttpStatus.NOT_FOUND);
    }

    switch (provider) {
      case OAuthProviderType.GOVTOOLS: {
        if (!oAuthProvider.refreshToken) {
          throw new HttpException(
            'Refresh token not found for OAuth provider',
            HttpStatus.BAD_REQUEST,
          );
        }
        const refreshedCreds = await this.govtoolsOAuthProvider.refreshToken({
          jwt: oAuthProvider.accessToken,
          refreshToken: oAuthProvider.refreshToken,
        });

        if (!oAuthProvider.id) {
          throw new HttpException(
            'OAuth provider ID not found',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        const updatedOAuth = await this.oAuthRepository.updateOAuth(
          oAuthProvider.id,
          {
            accessToken: refreshedCreds.jwt,
            refreshToken: refreshedCreds.refreshToken,
          },
        );

        return {
          id: updatedOAuth.id,
          provider: updatedOAuth.provider,
          stakeKeyBech32: updatedOAuth.stakeKeyBech32,
          accessToken: updatedOAuth.accessToken,
          createdAt: updatedOAuth.createdAt,
          updatedAt: updatedOAuth.updatedAt,
        };
      }
      default:
        throw new HttpException(
          'Unsupported OAuth provider',
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  async updateOAuthProvider(updateOAuthPayload: UpdateOAuthDto) {
    const existingOAuth = await this.oAuthRepository.findByStakeKey(
      updateOAuthPayload.stakeKeyBech32,
    );
    if (!existingOAuth || existingOAuth.length === 0) {
      throw new HttpException('OAuth provider not found', HttpStatus.NOT_FOUND);
    }

    if (!existingOAuth[0].id) {
      throw new HttpException(
        'OAuth provider ID not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const updatedOAuth = await this.oAuthRepository.updateOAuth(
      existingOAuth[0].id,
      updateOAuthPayload,
    );

    return {
      id: updatedOAuth.id,
      provider: updatedOAuth.provider,
      stakeKeyBech32: updatedOAuth.stakeKeyBech32,
      accessToken: updatedOAuth.accessToken,
      createdAt: updatedOAuth.createdAt,
      updatedAt: updatedOAuth.updatedAt,
    };
  }

  async deleteOAuthProvider(stakeKeyBech32: string, providerId: number) {
    if (!stakeKeyBech32 || !providerId) {
      throw new HttpException(
        'Signature ID and Provider ID are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingOAuth = await this.oAuthRepository.findByStakeKeyAndId(
      stakeKeyBech32,
      providerId,
    );
    if (!existingOAuth) {
      throw new HttpException('OAuth provider not found', HttpStatus.NOT_FOUND);
    }

    if (!existingOAuth.id) {
      throw new HttpException(
        'OAuth provider ID not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    await this.oAuthRepository.deleteOAuth(existingOAuth.id);
    return { message: 'OAuth provider deleted successfully' };
  }
}
