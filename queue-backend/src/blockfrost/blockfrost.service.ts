import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { RequestBudget, ProviderDeferred } from './request-budget';
import { staged, inBatch, batchAdmission } from './sync-run';
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
  live?: boolean;
  baseUrl?: string;
  responseType?: 'json' | 'arraybuffer';
}

@Injectable()
export class BlockfrostService {
  private readonly logger = new Logger(BlockfrostService.name);
  private readonly primaryConfig: BlockfrostConfig;
  private readonly fallbackConfig: BlockfrostConfig;
  private readonly ipfsProjectId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly budget: RequestBudget,
  ) {
    const gatewayUrl = this.configService
      .get<string>('CARDANO_API_URL')
      ?.trim();
    const gatewayProjectId = this.configService
      .get<string>('CARDANO_API_PROJECT_ID')
      ?.trim();
    if (Boolean(gatewayUrl) !== Boolean(gatewayProjectId)) {
      throw new Error(
        'CARDANO_API_URL and CARDANO_API_PROJECT_ID must be configured together',
      );
    }

    if (gatewayUrl) {
      try {
        const parsedUrl = new URL(gatewayUrl);
        if (
          !/^https?:\/\//.test(gatewayUrl) ||
          parsedUrl.username ||
          parsedUrl.password ||
          gatewayUrl.includes('?') ||
          gatewayUrl.includes('#')
        ) {
          throw new Error('Invalid gateway base URL');
        }
      } catch {
        throw new Error(
          'CARDANO_API_URL must be an HTTP(S) base URL without credentials, query or fragment',
        );
      }
    }

    this.primaryConfig = gatewayUrl
      ? { url: gatewayUrl.replace(/\/+$/, ''), projectId: gatewayProjectId }
      : {
          url: this.configService.get<string>('BLOCKFROST_NETWORK_URL') || '',
          projectId:
            this.configService.get<string>('BLOCKFROST_NETWORK_PROJECT_ID') ||
            '',
        };

    this.fallbackConfig = {
      url:
        this.configService.get<string>('BLOCKFROST_NETWORK_URL_FALLBACK') || '',
      projectId:
        this.configService.get<string>(
          'BLOCKFROST_NETWORK_PROJECT_ID_FALLBACK',
        ) || '',
    };

    this.ipfsProjectId =
      this.configService.get<string>('BLOCKFROST_IPFS_PROJECT_ID') ||
      this.configService.get<string>('BLOCKFROST_NETWORK_PROJECT_ID') ||
      '';
    this.logger.log(
      `Cardano routing configured gateway=${Boolean(gatewayUrl)} fallbackIndependent=${this.scope(this.primaryConfig, { method: 'GET', endpoint: '' }) !== this.scope(this.fallbackConfig, { method: 'GET', endpoint: '' })}`,
    );
  }

  private scope(config: BlockfrostConfig, options: RequestOptions): string {
    const route = options.baseUrl
      ? 'ipfs'
      : config === this.primaryConfig
        ? 'primary'
        : 'fallback';
    return this.budget.scope(
      route,
      options.headers?.project_id || config.projectId,
    );
  }

  private async executeWithFallback<T = any>(
    options: RequestOptions,
  ): Promise<T> {
    try {
      return await this.makeRequest<T>(this.primaryConfig, options);
    } catch (error) {
      // POST outcomes may be ambiguous: never retry or fail over a submission.
      if (options.method !== 'GET' || !(error instanceof ProviderDeferred))
        throw error;
      if (
        !this.fallbackConfig.url ||
        this.scope(this.primaryConfig, options) ===
          this.scope(this.fallbackConfig, options)
      )
        throw error;
      return this.makeRequest<T>(this.fallbackConfig, options);
    }
  }

  private async makeRequest<T>(
    config: BlockfrostConfig,
    options: RequestOptions,
  ): Promise<T> {
    const scope = this.scope(config, options);
    const dispatch = async (): Promise<T> => {
      for (let attempt = 0; ; attempt++) {
        batchAdmission();
        await this.budget.acquire(scope, inBatch());
        try {
          const url = (options.baseUrl || config.url) + options.endpoint;
          const settings = {
            headers: { project_id: config.projectId, ...options.headers },
            timeout: 30000,
            maxRedirects: 0,
            responseType: options.responseType || 'json',
          };
          const response = await lastValueFrom(
            options.method === 'GET'
              ? this.httpService.get(url, settings)
              : this.httpService.post(url, options.data, settings),
          );
          const listRequest =
            /^\/governance\/(dreps|proposals)(\?|$)/.test(options.endpoint) ||
            /\/(delegators|votes)\?/.test(options.endpoint);
          if (listRequest && !Array.isArray(response.data))
            throw new HttpException('Invalid Cardano list response', 503);
          const amountField = /^\/governance\/dreps\/[^/?]+$/.test(
            options.endpoint,
          )
            ? 'amount'
            : /^\/accounts\/[^/?]+$/.test(options.endpoint)
              ? 'controlled_amount'
              : undefined;
          if (
            amountField &&
            (!/^\d+$/.test(String(response.data?.[amountField])) ||
              !Number.isFinite(Number(response.data[amountField])))
          )
            throw new HttpException('Invalid Cardano amount response', 503);
          return response.data as T;
        } catch (error) {
          const status = error?.response?.status;
          const transient = !status || (status >= 500 && status < 600);
          // Long Retry-After is handled as durable deferral, never an in-worker sleep.
          if (
            options.method === 'GET' &&
            transient &&
            !error?.response?.headers?.['retry-after'] &&
            attempt < 2
          ) {
            await new Promise((resolve) =>
              setTimeout(resolve, 250 * 2 ** attempt),
            );
            continue;
          }
          const failure = await this.budget.failure(scope, error);
          if (options.method === 'POST' && transient)
            throw new HttpException(
              {
                message:
                  'Transaction submission outcome unknown; reconcile its hash before retrying',
                code: 'SUBMISSION_OUTCOME_UNKNOWN',
              },
              503,
            );
          throw failure;
        }
      }
    };
    return options.method === 'GET' && !options.live
      ? staged(
          `request:${scope}:${options.baseUrl || config.url}:${options.endpoint}`,
          dispatch,
        )
      : dispatch();
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

  /**
   * Confirms the configured primary Blockfrost serves live governance data
   * before a stake sync overwrites voting power. Guards the two failure modes
   * that otherwise corrupt every DRep at once:
   *   - primary points at a minibf/stub that does not implement governance
   *     (/epochs/latest 404s, while /governance/dreps returns placeholder amounts)
   *   - primary's db-sync backend lags chain tip, so its stake distribution is stale
   * Probes the primary directly (no fallback) and compares its epoch against the
   * hosted tip; the fallback being unreachable is tolerated, not fatal.
   */
  async assertGovernanceSourceFresh(): Promise<{
    ok: boolean;
    reason?: string;
    epoch?: number;
  }> {
    let primaryEpoch: number;
    try {
      const res = await this.makeRequest<{ epoch: number }>(
        this.primaryConfig,
        {
          method: 'GET',
          endpoint: '/epochs/latest',
          live: true,
        },
      );
      if (!Number.isSafeInteger(res?.epoch) || res.epoch < 0) {
        return {
          ok: false,
          reason:
            'primary /epochs/latest returned no epoch — source is not governance-capable',
        };
      }
      primaryEpoch = res.epoch;
    } catch (e) {
      if (e instanceof ProviderDeferred) throw e;
      const status = e?.status || e?.response?.status || e?.message;
      return {
        ok: false,
        reason: `primary /epochs/latest failed (${status}) — source is not governance-capable`,
      };
    }

    let tipEpoch: number | undefined;
    if (this.fallbackConfig.url) {
      try {
        const res = await this.makeRequest<{ epoch: number }>(
          this.fallbackConfig,
          { method: 'GET', endpoint: '/epochs/latest' },
        );
        if (Number.isSafeInteger(res?.epoch) && res.epoch >= 0)
          tipEpoch = res.epoch;
      } catch (e) {
        if (e instanceof ProviderDeferred && e.reason !== 'transient') throw e;
        // Fallback unavailable — proceed on the primary epoch rather than block.
      }
    }

    if (typeof tipEpoch === 'number' && primaryEpoch < tipEpoch) {
      return {
        ok: false,
        epoch: primaryEpoch,
        reason: `primary db-sync is behind chain tip (epoch ${primaryEpoch} < ${tipEpoch}); skipping to avoid overwriting voting power with stale stake`,
      };
    }

    return { ok: true, epoch: primaryEpoch };
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

  async getDRepDelegators(
    drepId: string,
    page = 1,
    count = 100,
    order = 'asc',
  ) {
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

  async getProposalVotes(
    txHash: string,
    certIndex: number,
    page = 1,
    count = 100,
    order = 'asc',
  ) {
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

  async getIpfsContent(ipfsPath: string): Promise<Buffer> {
    return this.makeRequest(
      { ...this.primaryConfig, projectId: this.ipfsProjectId },
      {
        method: 'GET',
        endpoint: `/ipfs/get/${ipfsPath}`,
        baseUrl: 'https://ipfs.blockfrost.io/api/v0',
        responseType: 'arraybuffer',
      },
    );
  }
}
