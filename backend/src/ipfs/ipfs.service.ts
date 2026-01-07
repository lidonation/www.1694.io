import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { lastValueFrom } from 'rxjs';
import {
  IPFSPinResponse,
  IPFSPinStatusResponse,
  IPFSResponse,
} from 'src/common/types';

interface IPFSConfig {
  url: string;
  projectId: string;
}

interface IPFSRequestOptions {
  method: 'GET' | 'POST';
  endpoint: string;
  data?: any;
  headers?: Record<string, string>;
  responseType?: 'json' | 'stream';
}

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly primaryConfig: IPFSConfig;
  private readonly fallbackConfig: IPFSConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.primaryConfig = {
      url: this.configService.get<string>('BLOCKFROST_IPFS_URL') || '',
      projectId: this.configService.get<string>('BLOCKFROST_IPFS_PROJECT_ID') || '',
    };

    this.fallbackConfig = {
      url: this.configService.get<string>('BLOCKFROST_IPFS_URL_FALLBACK') || '',
      projectId: this.configService.get<string>(
        'BLOCKFROST_IPFS_PROJECT_ID_FALLBACK',
      ) || '',
    };
  }

  private async executeWithFallback<T>(
    options: IPFSRequestOptions,
  ): Promise<T> {
    const { endpoint } = options;

    try {
      return await this.makeRequest<T>(this.primaryConfig, options);
    } catch (primaryError) {
      this.logger.warn(
        `Primary IPFS request failed for ${endpoint}: ${primaryError.message}. Trying fallback...`,
      );

      try {
        return await this.makeRequest<T>(this.fallbackConfig, options);
      } catch (fallbackError) {
        this.logger.error(
          `Both primary and fallback IPFS requests failed for ${endpoint}`,
          {
            primaryError: primaryError.message,
            fallbackError: fallbackError.message,
          },
        );

        throw new HttpException(
          fallbackError?.response?.data ||
            fallbackError.message ||
            'IPFS service unavailable',
          fallbackError?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  private async makeRequest<T>(
    config: IPFSConfig,
    options: IPFSRequestOptions,
  ): Promise<T> {
    const {
      method,
      endpoint,
      data,
      headers = {},
      responseType = 'json',
    } = options;
    const url = `${config.url}${endpoint}`;

    const requestHeaders = {
      project_id: config.projectId,
      ...headers,
    };

    const requestConfig = {
      headers: requestHeaders,
      ...(responseType && { responseType }),
    };

    try {
      let response;

      if (method === 'GET') {
        response = await lastValueFrom(
          this.httpService.get(url, requestConfig),
        );
      } else if (method === 'POST') {
        response = await lastValueFrom(
          this.httpService.post(url, data, requestConfig),
        );
      }

      return response.data;
    } catch (error) {
      throw new HttpException(
        error?.response?.data || error.message || 'IPFS request failed',
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getIPFSContent(ipfsHash: string) {
    return this.executeWithFallback({
      method: 'GET',
      endpoint: `/ipfs/gateway/${ipfsHash}`,
    });
  }

  async uploadAttachmentToIPFS(
    attachment: Express.Multer.File | Buffer | Uint8Array | Blob | FormData,
  ): Promise<IPFSResponse> {
    try {
      const ipfsRes = await this.executeWithFallback<IPFSResponse>({
        method: 'POST',
        endpoint: '/ipfs/add',
        data: attachment,
      });

      const ipfsPinStatus = await this.pinAttachmentToIPFS(ipfsRes.ipfs_hash);

      return {
        ...ipfsRes,
        state: ipfsPinStatus.state,
      };
    } catch (error) {
      this.logger.error('Failed to upload attachment to IPFS', error);
      throw new HttpException(
        error?.response?.data || error.message || 'Upload failed',
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async pinAttachmentToIPFS(hash: string): Promise<IPFSPinResponse> {
    return this.executeWithFallback<IPFSPinResponse>({
      method: 'POST',
      endpoint: `/ipfs/pin/add/${hash}`,
      data: {},
    });
  }

  async checkPinStatus(hash: string): Promise<IPFSPinStatusResponse> {
    return this.executeWithFallback<IPFSPinStatusResponse>({
      method: 'GET',
      endpoint: `/ipfs/pin/list/${hash}`,
    });
  }

  async unpinAttachmentFromIPFS(hash: string): Promise<IPFSPinResponse> {
    return this.executeWithFallback<IPFSPinResponse>({
      method: 'POST',
      endpoint: `/ipfs/pin/remove/${hash}`,
      data: {},
    });
  }

  async getAttachmentFromIPFS(hash: string, res: Response): Promise<any> {
    try {
      let response;

      try {
        response = await this.makeRequest(this.primaryConfig, {
          method: 'GET',
          endpoint: `/ipfs/gateway/${hash}`,
          responseType: 'stream',
        });
      } catch (primaryError) {
        this.logger.warn(
          `Primary IPFS stream failed for ${hash}, trying fallback...`,
        );
        response = await this.makeRequest(this.fallbackConfig, {
          method: 'GET',
          endpoint: `/ipfs/gateway/${hash}`,
          responseType: 'stream',
        });
      }

      for (const [key, value] of Object.entries(response.headers || {})) {
        res.setHeader(key, value as string);
      }

      return response.pipe(res);
    } catch (error) {
      this.logger.error(
        `Failed to stream IPFS content for hash: ${hash}`,
        error,
      );
      throw new HttpException(
        error?.response?.statusText ||
          error.message ||
          'Failed to fetch IPFS content',
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
