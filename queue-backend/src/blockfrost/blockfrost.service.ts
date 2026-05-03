import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { BlockfrostUTXO } from './blockfrost.types';

interface BlockfrostConfig {
  url: string;
  projectId: string;
}

interface RequestOptions {
  method: 'GET' | 'POST';
  endpoint: string;
  data?: any;
  headers?: Record<string, string>;
}

@Injectable()
export class BlockfrostService {
  private readonly logger = new Logger(BlockfrostService.name);
  private readonly primaryConfig: BlockfrostConfig;
  private readonly fallbackConfig: BlockfrostConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.primaryConfig = {
      url: this.configService.get<string>('BLOCKFROST_NETWORK_URL') || '',
      projectId: this.configService.get<string>(
        'BLOCKFROST_NETWORK_PROJECT_ID',
      ) || '',
    };

    this.fallbackConfig = {
      url: this.configService.get<string>('BLOCKFROST_NETWORK_URL_FALLBACK') || '',
      projectId: this.configService.get<string>(
        'BLOCKFROST_NETWORK_PROJECT_ID_FALLBACK',
      ) || '',
    };
  }

  private async executeWithFallback<T = any>(options: RequestOptions): Promise<T> {
    const { endpoint } = options;

    try {
      return await this.retryRequest(() => this.makeRequest<T>(this.primaryConfig, options));
    } catch (err) {
      const status = err.status || err.response?.status;
      if (status === 404) throw err;

      this.logger.warn(`Primary failed for ${endpoint} (Status: ${status}). Trying fallback...`);

      try {
        return await this.retryRequest(() => this.makeRequest<T>(this.fallbackConfig, options));
      } catch (fErr) {
        const fStatus = fErr.status || fErr.response?.status;
        if (fStatus !== 404) {
          this.logger.error(`Fallback failed for ${endpoint}. Statuses: ${status} / ${fStatus}`, { endpoint });
        }
        throw new HttpException(fErr?.response?.data || fErr.message || 'API unavailable', fStatus || 500);
      }
    }
  }

  async retryRequest<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      const retryable = e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT' || e.status === 429 || (e.status >= 500 && e.status < 600);
      if (retries > 0 && retryable) {
        this.logger.warn(`Retry ${retries} in ${delay}ms (Code: ${e.code || e.status})`);
        await new Promise(r => setTimeout(r, delay));
        return this.retryRequest(fn, retries - 1, delay * 2);
      }
      throw e;
    }
  }


  private async makeRequest<T>(
    config: BlockfrostConfig,
    options: RequestOptions,
  ): Promise<T> {
    const { method, endpoint, data, headers = {} } = options;
    const url = `${config.url}${endpoint}`;

    const requestHeaders = {
      project_id: config.projectId,
      ...headers,
    };

    try {
      let response;

      if (method === 'GET') {
        response = await lastValueFrom(
          this.httpService.get(url, { headers: requestHeaders }),
        );
      } else if (method === 'POST') {
        response = await lastValueFrom(
          this.httpService.post(url, data, { headers: requestHeaders }),
        );
      }

      return response.data;
    } catch (error) {
      throw new HttpException(
        error?.response?.data || error.message || 'Request failed',
        error?.response?.status || 500,
      );
    }
  }

  async getLatestBlock() {
    return this.executeWithFallback({
      method: 'GET',
      endpoint: '/blocks/latest',
    });
  }

  async getLatestEpoch() {
    return this.executeWithFallback({
      method: 'GET',
      endpoint: '/epochs/latest',
    });
  }

  async getAddressUtxos(address: string): Promise<BlockfrostUTXO[]> {
    return await this.executeWithFallback<BlockfrostUTXO[]>({
      method: 'GET',
      endpoint: `/addresses/${address}/utxos`,
    });
  }

  async getEpochParameters() {
    return this.executeWithFallback({
      method: 'GET',
      endpoint: '/epochs/latest/parameters',
    });
  }

  async getStakeAddressInfo(stakeAddress: string) {
    return this.executeWithFallback({
      method: 'GET',
      endpoint: `/accounts/${stakeAddress}`,
    });
  }

  async getAddressesRelatedToStakeAddress(stakeAddress: string) {
    return this.executeWithFallback({
      method: 'GET',
      endpoint: `/accounts/${stakeAddress}/addresses`,
    });
  }

  async submitTransaction(transactionCbor: string) {
    if (!transactionCbor) {
      throw new HttpException('Transaction CBOR is required', 400);
    }

    return this.executeWithFallback({
      method: 'POST',
      endpoint: '/tx/submit',
      data: Buffer.from(transactionCbor, 'hex'),
      headers: {
        'Content-Type': 'application/cbor',
      },
    });
  }

  async getAllDReps() {
    return this.executeWithFallback({
      method: 'GET',
      endpoint: '/governance/dreps',
    });
  }

  async getDRepInfo(drepId: string) {
    return this.executeWithFallback<any>({
      method: 'GET',
      endpoint: `/governance/dreps/${drepId}`,
    });
  }

  async getDRepMetadata(drepId: string) {
    return this.executeWithFallback<any>({
      method: 'GET',
      endpoint: `/governance/dreps/${drepId}/metadata`,
    });
  }

  async getDRepDelegators(drepId: string, page = 1, count = 100, order = 'asc') {
    return this.executeWithFallback({
      method: 'GET',
      endpoint: `/governance/dreps/${drepId}/delegators?page=${page}&count=${count}&order=${order}`,
    });
  }

  async getAllProposals(page = 1, count = 100, order = 'asc') {
    return this.executeWithFallback<any>({
      method: 'GET',
      endpoint: `/governance/proposals?page=${page}&count=${count}&order=${order}`,
    });
  }

  async getProposal(txHash: string, certIndex: number) {
    return this.executeWithFallback<any>({
      method: 'GET',
      endpoint: `/governance/proposals/${txHash}/${certIndex}`,
    });
  }

  async getProposalMetadata(txHash: string, certIndex: number) {
    return this.executeWithFallback<any>({
      method: 'GET',
      endpoint: `/governance/proposals/${txHash}/${certIndex}/metadata`,
    });
  }

  async getProposalVotes(txHash: string, certIndex: number, page = 1, count = 100, order = 'asc') {
    return this.executeWithFallback({
      method: 'GET',
      endpoint: `/governance/proposals/${txHash}/${certIndex}/votes?page=${page}&count=${count}&order=${order}`,
    });
  }

  async getAllDRepsWithPagination(page = 1, count = 100, order = 'asc') {
    return this.executeWithFallback<any>({
      method: 'GET',
      endpoint: `/governance/dreps?page=${page}&count=${count}&order=${order}`,
    });
  }

  async getDRepVotes(drepId: string, page = 1, count = 100, order = 'asc') {
    return this.executeWithFallback<any>({
      method: 'GET',
      endpoint: `/governance/dreps/${drepId}/votes?page=${page}&count=${count}&order=${order}`,
    });
  }

  async getTransaction(txHash: string) {
    return this.executeWithFallback({
      method: 'GET',
      endpoint: `/txs/${txHash}`,
    });
  }

  async getEpoch(epochNumber: number | 'latest') {
    return this.executeWithFallback({
      method: 'GET',
      endpoint: `/epochs/${epochNumber}`,
    });
  }
}
