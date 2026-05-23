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

interface KuboConfig {
  apiUrl: string;    // http://host:5001  — for /api/v0/ calls
  gatewayUrl: string; // http://host:8080  — for content fetch
}

interface BlockfrostIPFSConfig {
  url: string;
  projectId: string;
}

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly kubo: KuboConfig | null;
  private readonly blockfrostPrimary: BlockfrostIPFSConfig;
  private readonly blockfrostFallback: BlockfrostIPFSConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const kuboApiUrl = this.configService.get<string>('IPFS_KUBO_API_URL');
    const kuboGatewayUrl = this.configService.get<string>('IPFS_KUBO_GATEWAY_URL');

    this.kubo = kuboApiUrl
      ? { apiUrl: kuboApiUrl, gatewayUrl: kuboGatewayUrl || kuboApiUrl.replace(':5001', ':8080') }
      : null;

    this.blockfrostPrimary = {
      url: this.configService.get<string>('BLOCKFROST_IPFS_URL') || '',
      projectId: this.configService.get<string>('BLOCKFROST_IPFS_PROJECT_ID') || '',
    };

    this.blockfrostFallback = {
      url: this.configService.get<string>('BLOCKFROST_IPFS_URL_FALLBACK') || '',
      projectId: this.configService.get<string>('BLOCKFROST_IPFS_PROJECT_ID_FALLBACK') || '',
    };
  }

  private async withChain<T>(
    attempts: Array<{ label: string; fn: () => Promise<T> }>,
  ): Promise<T> {
    let lastError: any;

    for (const { label, fn } of attempts) {
      try {
        return await fn();
      } catch (err) {
        this.logger.warn(`IPFS [${label}] failed: ${err.message}`);
        lastError = err;
      }
    }

    throw new HttpException(
      lastError?.response?.data || lastError?.message || 'All IPFS endpoints failed',
      lastError?.response?.status || HttpStatus.BAD_GATEWAY,
    );
  }

  // ── Kubo helpers ──────────────────────────────────────────────────────────

  private async kuboPost<T>(path: string, data?: any, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.kubo!.apiUrl}/api/v0${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await lastValueFrom(this.httpService.post<T>(url.toString(), data));
    return res.data;
  }

  // ── Blockfrost helpers ────────────────────────────────────────────────────

  private bfHeaders(cfg: BlockfrostIPFSConfig) {
    return { project_id: cfg.projectId };
  }

  private async bfGet<T>(cfg: BlockfrostIPFSConfig, endpoint: string): Promise<T> {
    const res = await lastValueFrom(
      this.httpService.get<T>(`${cfg.url}${endpoint}`, { headers: this.bfHeaders(cfg) }),
    );
    return res.data;
  }

  private async bfPost<T>(cfg: BlockfrostIPFSConfig, endpoint: string, data?: any): Promise<T> {
    const res = await lastValueFrom(
      this.httpService.post<T>(`${cfg.url}${endpoint}`, data, { headers: this.bfHeaders(cfg) }),
    );
    return res.data;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async getIPFSContent(ipfsHash: string): Promise<any> {
    return this.withChain([
      ...(this.kubo ? [{
        label: 'kubo-gateway',
        fn: () => lastValueFrom(
          this.httpService.get(`${this.kubo!.gatewayUrl}/ipfs/${ipfsHash}`),
        ).then(r => r.data),
      }] : []),
      { label: 'bf-primary', fn: () => this.bfGet(this.blockfrostPrimary, `/ipfs/gateway/${ipfsHash}`) },
      { label: 'bf-fallback', fn: () => this.bfGet(this.blockfrostFallback, `/ipfs/gateway/${ipfsHash}`) },
    ]);
  }

  async uploadAttachmentToIPFS(
    attachment: Express.Multer.File | Buffer | Uint8Array | Blob | FormData,
  ): Promise<IPFSResponse> {
    const ipfsRes = await this.withChain<IPFSResponse>([
      ...(this.kubo ? [{
        label: 'kubo-add',
        fn: async () => {
          const raw = await this.kuboPost<{ Hash: string; Name: string; Size: string }>(
            '/add', attachment,
          );
          return { ipfs_hash: raw.Hash, name: raw.Name, size: Number(raw.Size) } satisfies IPFSResponse;
        },
      }] : []),
      { label: 'bf-primary', fn: () => this.bfPost<IPFSResponse>(this.blockfrostPrimary, '/ipfs/add', attachment) },
      { label: 'bf-fallback', fn: () => this.bfPost<IPFSResponse>(this.blockfrostFallback, '/ipfs/add', attachment) },
    ]);

    const pin = await this.pinAttachmentToIPFS(ipfsRes.ipfs_hash);
    return { ...ipfsRes, state: pin.state };
  }

  async pinAttachmentToIPFS(hash: string): Promise<IPFSPinResponse> {
    return this.withChain<IPFSPinResponse>([
      ...(this.kubo ? [{
        label: 'kubo-pin-add',
        fn: async () => {
          await this.kuboPost('/pin/add', undefined, { arg: hash });
          return { ipfs_hash: hash, state: 'pinned' as const };
        },
      }] : []),
      { label: 'bf-primary', fn: () => this.bfPost<IPFSPinResponse>(this.blockfrostPrimary, `/ipfs/pin/add/${hash}`, {}) },
      { label: 'bf-fallback', fn: () => this.bfPost<IPFSPinResponse>(this.blockfrostFallback, `/ipfs/pin/add/${hash}`, {}) },
    ]);
  }

  async checkPinStatus(hash: string): Promise<IPFSPinStatusResponse> {
    return this.withChain<IPFSPinStatusResponse>([
      ...(this.kubo ? [{
        label: 'kubo-pin-ls',
        fn: async () => {
          const raw = await this.kuboPost<{ Keys: Record<string, { Type: string }> }>(
            '/pin/ls', undefined, { arg: hash },
          );
          const entry = raw.Keys?.[hash];
          return {
            ipfs_hash: hash,
            state: (entry ? 'pinned' : 'unpinned') as IPFSPinStatusResponse['state'],
            size: '0',
            time_created: 0,
            time_pinned: 0,
          };
        },
      }] : []),
      { label: 'bf-primary', fn: () => this.bfGet<IPFSPinStatusResponse>(this.blockfrostPrimary, `/ipfs/pin/list/${hash}`) },
      { label: 'bf-fallback', fn: () => this.bfGet<IPFSPinStatusResponse>(this.blockfrostFallback, `/ipfs/pin/list/${hash}`) },
    ]);
  }

  async unpinAttachmentFromIPFS(hash: string): Promise<IPFSPinResponse> {
    return this.withChain<IPFSPinResponse>([
      ...(this.kubo ? [{
        label: 'kubo-pin-rm',
        fn: async () => {
          await this.kuboPost('/pin/rm', undefined, { arg: hash });
          return { ipfs_hash: hash, state: 'unpinned' as const };
        },
      }] : []),
      { label: 'bf-primary', fn: () => this.bfPost<IPFSPinResponse>(this.blockfrostPrimary, `/ipfs/pin/remove/${hash}`, {}) },
      { label: 'bf-fallback', fn: () => this.bfPost<IPFSPinResponse>(this.blockfrostFallback, `/ipfs/pin/remove/${hash}`, {}) },
    ]);
  }

  async getAttachmentFromIPFS(hash: string, res: Response): Promise<any> {
    const streamAttempts = [
      ...(this.kubo ? [{ label: 'kubo-gateway', url: `${this.kubo.gatewayUrl}/ipfs/${hash}` }] : []),
      { label: 'bf-primary', url: `${this.blockfrostPrimary.url}/ipfs/gateway/${hash}`, headers: this.bfHeaders(this.blockfrostPrimary) },
      { label: 'bf-fallback', url: `${this.blockfrostFallback.url}/ipfs/gateway/${hash}`, headers: this.bfHeaders(this.blockfrostFallback) },
    ];

    for (const attempt of streamAttempts) {
      try {
        const response = await lastValueFrom(
          this.httpService.get(attempt.url, {
            responseType: 'stream',
            headers: (attempt as any).headers,
          }),
        );
        for (const [key, value] of Object.entries(response.headers || {})) {
          res.setHeader(key, value as string);
        }
        return response.data.pipe(res);
      } catch (err) {
        this.logger.warn(`IPFS stream [${attempt.label}] failed for ${hash}: ${err.message}`);
      }
    }

    throw new HttpException('Failed to stream IPFS content', HttpStatus.BAD_GATEWAY);
  }
}
