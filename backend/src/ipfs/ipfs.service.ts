import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Readable } from 'node:stream';
import { lastValueFrom } from 'rxjs';
import {
  IPFSPinResponse,
  IPFSPinStatusResponse,
  IPFSResponse,
} from 'src/common/types';
import {
  ClusterAddResponse,
  ClusterConfig,
  ClusterPinStatus,
} from './cluster.types';

interface BlockfrostIPFSConfig {
  url: string;
  projectId: string;
}

const requestOptions = { timeout: 30_000, maxRedirects: 0 };
const replication = { 'replication-min': '-1', 'replication-max': '-1' };

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly cluster: ClusterConfig | null;
  private readonly gatewayUrl: string;
  private readonly blockfrostPrimary: BlockfrostIPFSConfig;
  private readonly blockfrostFallback: BlockfrostIPFSConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const apiUrl = this.configService.get<string>('IPFS_CLUSTER_API_URL') || '';
    const username =
      this.configService.get<string>('IPFS_CLUSTER_API_USER') || '';
    const password =
      this.configService.get<string>('IPFS_CLUSTER_API_PASSWORD') || '';
    if ((apiUrl || username || password) && !(apiUrl && username && password)) {
      throw new Error('IPFS cluster requires URL, user and password together');
    }
    this.cluster = apiUrl
      ? { apiUrl: this.baseUrl(apiUrl, 'cluster'), username, password }
      : null;
    const gatewayUrl =
      this.configService.get<string>('IPFS_GATEWAY_URL') ||
      this.configService.get<string>('IPFS_KUBO_GATEWAY_URL');
    this.gatewayUrl = gatewayUrl ? this.baseUrl(gatewayUrl, 'gateway') : '';
    this.blockfrostPrimary = {
      url: this.configService.get<string>('BLOCKFROST_IPFS_URL') || '',
      projectId:
        this.configService.get<string>('BLOCKFROST_IPFS_PROJECT_ID') || '',
    };
    this.blockfrostFallback = {
      url: this.configService.get<string>('BLOCKFROST_IPFS_URL_FALLBACK') || '',
      projectId:
        this.configService.get<string>('BLOCKFROST_IPFS_PROJECT_ID_FALLBACK') ||
        '',
    };
  }

  private baseUrl(value: string, kind: string): string {
    try {
      const url = new URL(value);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      )
        throw new Error();
      return url.toString().replace(/\/$/, '');
    } catch {
      throw new Error(`Invalid IPFS ${kind} URL`);
    }
  }

  private ipfsPath(path: string): string {
    const unsafe =
      !path ||
      path.split('/').some((segment) => {
        try {
          const decoded = decodeURIComponent(segment);
          return (
            !segment ||
            decoded === '.' ||
            decoded === '..' ||
            /[?#\\]/.test(decoded)
          );
        } catch {
          return true;
        }
      });
    if (unsafe)
      throw new HttpException('Invalid IPFS path', HttpStatus.BAD_REQUEST);
    return path;
  }

  private failureReason(err: unknown): string {
    const { response, code } = (err ?? {}) as {
      response?: { status?: number };
      code?: string;
    };
    return String(response?.status ?? code ?? 'error');
  }

  private async withChain<T>(
    attempts: Array<{ label: string; fn: () => Promise<T> }>,
  ): Promise<T> {
    for (const { label, fn } of attempts) {
      try {
        return await fn();
      } catch (err) {
        this.logger.warn(`IPFS [${label}] failed: ${this.failureReason(err)}`);
      }
    }
    throw new HttpException(
      'All IPFS endpoints failed',
      HttpStatus.BAD_GATEWAY,
    );
  }

  private async clusterRequest<T>(
    method: 'get' | 'post' | 'delete',
    path: string,
    data?: FormData,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${this.cluster.apiUrl}${path}`);
    for (const [key, value] of Object.entries(params || {}))
      url.searchParams.set(key, value);
    const config = {
      ...requestOptions,
      timeout:
        method === 'post' && path === '/add' ? 120_000 : requestOptions.timeout,
      auth: {
        username: this.cluster.username,
        password: this.cluster.password,
      },
    };
    const response = await lastValueFrom(
      method === 'post'
        ? this.httpService.post<T>(url.toString(), data, config)
        : this.httpService[method]<T>(url.toString(), config),
    );
    return response.data;
  }

  private multipart(
    attachment: Express.Multer.File | Buffer | Uint8Array | Blob | FormData,
  ): FormData {
    let file: Blob;
    let name = 'attachment';
    if (attachment instanceof FormData) {
      const entries = Array.from(attachment.values());
      if (entries.length !== 1 || !(entries[0] instanceof Blob))
        throw new HttpException(
          'Expected one attachment file',
          HttpStatus.BAD_REQUEST,
        );
      file = entries[0];
      name = (file as File).name || name;
    } else if (attachment instanceof Blob) {
      file = attachment;
      name = (file as File).name || name;
    } else if (attachment instanceof Uint8Array) {
      file = new Blob([new Uint8Array(attachment)]);
    } else if (attachment?.buffer instanceof Buffer) {
      file = new Blob([new Uint8Array(attachment.buffer)], {
        type: attachment.mimetype,
      });
      name = attachment.originalname || name;
    } else {
      throw new HttpException(
        'Invalid attachment format',
        HttpStatus.BAD_REQUEST,
      );
    }
    const form = new FormData();
    form.append('file', file, name);
    return form;
  }

  private bfHeaders(cfg: BlockfrostIPFSConfig) {
    return { project_id: cfg.projectId };
  }

  private async bfGet<T>(
    cfg: BlockfrostIPFSConfig,
    endpoint: string,
  ): Promise<T> {
    const res = await lastValueFrom(
      this.httpService.get<T>(`${cfg.url}${endpoint}`, {
        ...requestOptions,
        headers: this.bfHeaders(cfg),
      }),
    );
    return res.data;
  }

  private async bfPost<T>(
    cfg: BlockfrostIPFSConfig,
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const res = await lastValueFrom(
      this.httpService.post<T>(`${cfg.url}${endpoint}`, data, {
        ...requestOptions,
        headers: this.bfHeaders(cfg),
      }),
    );
    return res.data;
  }

  async getIPFSContent(hash: string): Promise<any> {
    const ipfsHash = this.ipfsPath(hash);
    return this.withChain([
      ...(this.gatewayUrl
        ? [
            {
              label: 'cluster-gateway',
              fn: () =>
                lastValueFrom(
                  this.httpService.get<unknown>(
                    `${this.gatewayUrl}/ipfs/${ipfsHash}`,
                    requestOptions,
                  ),
                ).then((r) => r.data),
            },
          ]
        : []),
      {
        label: 'bf-primary',
        fn: () =>
          this.bfGet(this.blockfrostPrimary, `/ipfs/gateway/${ipfsHash}`),
      },
      {
        label: 'bf-fallback',
        fn: () =>
          this.bfGet(this.blockfrostFallback, `/ipfs/gateway/${ipfsHash}`),
      },
    ]);
  }

  async uploadAttachmentToIPFS(
    attachment: Express.Multer.File | Buffer | Uint8Array | Blob | FormData,
  ): Promise<IPFSResponse> {
    const form = this.multipart(attachment);
    return this.withChain<IPFSResponse>([
      ...(this.cluster
        ? [
            {
              label: 'cluster-add',
              fn: async () => {
                const raw = await this.clusterRequest<ClusterAddResponse[]>(
                  'post',
                  '/add',
                  form,
                  {
                    'stream-channels': 'false',
                    progress: 'false',
                    ...replication,
                  },
                );
                const result =
                  Array.isArray(raw) && raw.length === 1 ? raw[0] : null;
                if (
                  !result ||
                  typeof result.cid !== 'string' ||
                  !result.cid ||
                  typeof result.name !== 'string' ||
                  !Number.isSafeInteger(result.size ?? 0) ||
                  (result.size ?? 0) < 0
                )
                  throw new Error('Invalid cluster add response');
                return {
                  ipfs_hash: result.cid,
                  name: result.name,
                  size: result.size ?? 0,
                  state: 'queued' as const,
                };
              },
            },
          ]
        : []),
      ...[this.blockfrostPrimary, this.blockfrostFallback].map(
        (cfg, index) => ({
          label: index ? 'bf-fallback' : 'bf-primary',
          fn: async () => {
            const result = await this.bfPost<IPFSResponse>(
              cfg,
              '/ipfs/add',
              form,
            );
            const pin = await this.pinAttachmentToIPFS(result.ipfs_hash);
            return { ...result, state: pin.state };
          },
        }),
      ),
    ]);
  }

  async pinAttachmentToIPFS(hash: string): Promise<IPFSPinResponse> {
    return this.withChain<IPFSPinResponse>([
      ...(this.cluster
        ? [
            {
              label: 'cluster-pin',
              fn: async () => {
                await this.clusterRequest(
                  'post',
                  `/pins/${encodeURIComponent(hash)}`,
                  undefined,
                  replication,
                );
                return { ipfs_hash: hash, state: 'queued' as const };
              },
            },
          ]
        : []),
      {
        label: 'bf-primary',
        fn: () =>
          this.bfPost<IPFSPinResponse>(
            this.blockfrostPrimary,
            `/ipfs/pin/add/${hash}`,
            {},
          ),
      },
      {
        label: 'bf-fallback',
        fn: () =>
          this.bfPost<IPFSPinResponse>(
            this.blockfrostFallback,
            `/ipfs/pin/add/${hash}`,
            {},
          ),
      },
    ]);
  }

  async checkPinStatus(hash: string): Promise<IPFSPinStatusResponse> {
    return this.withChain<IPFSPinStatusResponse>([
      ...(this.cluster
        ? [
            {
              label: 'cluster-status',
              fn: async () => {
                const raw = await this.clusterRequest<ClusterPinStatus>(
                  'get',
                  `/pins/${encodeURIComponent(hash)}`,
                );
                if (
                  !raw?.peer_map ||
                  typeof raw.peer_map !== 'object' ||
                  Array.isArray(raw.peer_map)
                )
                  throw new Error('Invalid cluster status response');
                const states = Object.values(raw.peer_map).map(
                  (peer) => peer.status,
                );
                const state = states.some((s) =>
                  [
                    'pin_error',
                    'unpin_error',
                    'cluster_error',
                    'error',
                  ].includes(s),
                )
                  ? 'failed'
                  : states.length && states.every((s) => s === 'pinned')
                    ? 'pinned'
                    : states.length && states.every((s) => s === 'unpinned')
                      ? 'unpinned'
                      : 'queued';
                return {
                  ipfs_hash: hash,
                  state,
                  size: '0',
                  time_created: 0,
                  time_pinned: 0,
                } satisfies IPFSPinStatusResponse;
              },
            },
          ]
        : []),
      {
        label: 'bf-primary',
        fn: () =>
          this.bfGet<IPFSPinStatusResponse>(
            this.blockfrostPrimary,
            `/ipfs/pin/list/${hash}`,
          ),
      },
      {
        label: 'bf-fallback',
        fn: () =>
          this.bfGet<IPFSPinStatusResponse>(
            this.blockfrostFallback,
            `/ipfs/pin/list/${hash}`,
          ),
      },
    ]);
  }

  async unpinAttachmentFromIPFS(hash: string): Promise<IPFSPinResponse> {
    return this.withChain<IPFSPinResponse>([
      ...(this.cluster
        ? [
            {
              label: 'cluster-unpin',
              fn: async () => {
                await this.clusterRequest(
                  'delete',
                  `/pins/${encodeURIComponent(hash)}`,
                );
                return { ipfs_hash: hash, state: 'unpinned' as const };
              },
            },
          ]
        : []),
      {
        label: 'bf-primary',
        fn: () =>
          this.bfPost<IPFSPinResponse>(
            this.blockfrostPrimary,
            `/ipfs/pin/remove/${hash}`,
            {},
          ),
      },
      {
        label: 'bf-fallback',
        fn: () =>
          this.bfPost<IPFSPinResponse>(
            this.blockfrostFallback,
            `/ipfs/pin/remove/${hash}`,
            {},
          ),
      },
    ]);
  }

  async getAttachmentFromIPFS(path: string, res: Response): Promise<any> {
    const hash = this.ipfsPath(path);
    const streamAttempts = [
      ...(this.gatewayUrl
        ? [
            {
              label: 'cluster-gateway',
              url: `${this.gatewayUrl}/ipfs/${hash}`,
              headers: undefined,
            },
          ]
        : []),
      {
        label: 'bf-primary',
        url: `${this.blockfrostPrimary.url}/ipfs/gateway/${hash}`,
        headers: this.bfHeaders(this.blockfrostPrimary),
      },
      {
        label: 'bf-fallback',
        url: `${this.blockfrostFallback.url}/ipfs/gateway/${hash}`,
        headers: this.bfHeaders(this.blockfrostFallback),
      },
    ];
    for (const attempt of streamAttempts) {
      try {
        const response = await lastValueFrom(
          this.httpService.get<Readable>(attempt.url, {
            ...requestOptions,
            responseType: 'stream',
            headers: attempt.headers,
          }),
        );
        for (const [key, value] of Object.entries(response.headers || {}))
          res.setHeader(key, value as string);
        return response.data.pipe(res);
      } catch (err) {
        this.logger.warn(
          `IPFS stream [${attempt.label}] failed: ${this.failureReason(err)}`,
        );
      }
    }
    throw new HttpException(
      'Failed to stream IPFS content',
      HttpStatus.BAD_GATEWAY,
    );
  }
}
