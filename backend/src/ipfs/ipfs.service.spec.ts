import { HttpService } from '@nestjs/axios';
import { HttpException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
import { of, throwError } from 'rxjs';
import { IpfsService } from './ipfs.service';

const cid = 'bafkreigh2akiscaildc3hkgzw7jvpr3ovbgatw3vqv4kxiloj5xatbdp7y';
const cluster = 'http://ipfs.ipfs.svc.cluster.local:9094';
const gateway = 'http://ipfs.ipfs.svc.cluster.local:8080';
const settings: Record<string, string> = {
  IPFS_CLUSTER_API_URL: cluster,
  IPFS_CLUSTER_API_USER: 'voltaire',
  IPFS_CLUSTER_API_PASSWORD: 'sentinel-secret',
  IPFS_GATEWAY_URL: gateway,
  BLOCKFROST_IPFS_URL: 'https://primary.test',
  BLOCKFROST_IPFS_PROJECT_ID: 'primary-key',
  BLOCKFROST_IPFS_URL_FALLBACK: 'https://fallback.test',
  BLOCKFROST_IPFS_PROJECT_ID_FALLBACK: 'fallback-key',
};
const fail = () => throwError(() => new Error('sentinel-secret'));
const ok = (data: unknown) => of({ data } as AxiosResponse<unknown>);

function setup(overrides: Record<string, string> = {}) {
  const config = { ...settings, ...overrides };
  const http = {
    get: jest.fn<
      Observable<AxiosResponse<unknown>>,
      [string, AxiosRequestConfig?]
    >(),
    post: jest.fn<
      Observable<AxiosResponse<unknown>>,
      [string, unknown?, AxiosRequestConfig?]
    >(),
    delete: jest.fn<
      Observable<AxiosResponse<unknown>>,
      [string, AxiosRequestConfig?]
    >(),
  };
  const service = new IpfsService(
    new ConfigService(config),
    http as unknown as HttpService,
  );
  return { service, http };
}

describe('Contabo IPFS contract', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });
  afterEach(() => jest.restoreAllMocks());

  it('reads through the gateway without cluster credentials or Kubo RPC', async () => {
    const { service, http } = setup({
      IPFS_CLUSTER_API_URL: '',
      IPFS_CLUSTER_API_USER: '',
      IPFS_CLUSTER_API_PASSWORD: '',
    });
    http.get.mockReturnValue(ok({ title: 'metadata' }));
    expect(await service.getIPFSContent(cid)).toEqual({ title: 'metadata' });
    expect(http.get).toHaveBeenCalledWith(
      `${gateway}/ipfs/${cid}`,
      expect.objectContaining({ timeout: 30_000 }),
    );
    expect(http.get.mock.calls[0][1]).not.toHaveProperty('auth');
  });

  it('prefers canonical gateway over the legacy migration alias', async () => {
    const { service, http } = setup({
      IPFS_KUBO_GATEWAY_URL: 'http://retired:8080',
    });
    http.get.mockReturnValue(ok('data'));
    await service.getIPFSContent(cid);
    expect(http.get.mock.calls[0][0]).toBe(`${gateway}/ipfs/${cid}`);
  });

  it('supports gateway migration alias independently of cluster', async () => {
    const { service, http } = setup({
      IPFS_GATEWAY_URL: '',
      IPFS_KUBO_GATEWAY_URL: gateway,
    });
    http.get.mockReturnValue(ok('data'));
    await service.getIPFSContent(cid);
    expect(http.get.mock.calls[0][0]).toBe(`${gateway}/ipfs/${cid}`);
  });

  it('falls back from gateway to both independent Blockfrost credentials', async () => {
    const { service, http } = setup();
    http.get
      .mockReturnValueOnce(fail())
      .mockReturnValueOnce(fail())
      .mockReturnValueOnce(ok('fallback'));
    expect(await service.getIPFSContent(cid)).toBe('fallback');
    expect(http.get.mock.calls.map((c) => c[0])).toEqual([
      `${gateway}/ipfs/${cid}`,
      `https://primary.test/ipfs/gateway/${cid}`,
      `https://fallback.test/ipfs/gateway/${cid}`,
    ]);
    expect(http.get.mock.calls[1][1].headers).toEqual({
      project_id: 'primary-key',
    });
    expect(http.get.mock.calls[2][1].headers).toEqual({
      project_id: 'fallback-key',
    });
  });

  it.each([
    'IPFS_CLUSTER_API_URL',
    'IPFS_CLUSTER_API_USER',
    'IPFS_CLUSTER_API_PASSWORD',
  ])(
    'rejects partial cluster configuration missing %s without leaking values',
    (key) => {
      expect(() => setup({ [key]: '' })).toThrow(
        'IPFS cluster requires URL, user and password together',
      );
    },
  );

  it.each([
    'http://user:password@host:9094',
    'file:///tmp/api',
    'https://host:9094/?token=secret',
  ])('rejects unsafe cluster URL %s', (url) => {
    expect(() => setup({ IPFS_CLUSTER_API_URL: url })).toThrow(
      'Invalid IPFS cluster URL',
    );
  });

  it('uploads multipart to the cluster with all-peer replication and lowercase response mapping', async () => {
    const { service, http } = setup();
    const form = new FormData();
    form.append('attachment', new Blob(['hello']), 'hello.txt');
    http.post.mockReturnValue(ok([{ cid, name: 'hello.txt', size: 5 }]));
    expect(await service.uploadAttachmentToIPFS(form)).toEqual({
      ipfs_hash: cid,
      name: 'hello.txt',
      size: 5,
      state: 'queued',
    });
    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, input, config] = http.post.mock.calls[0];
    const body = input as FormData;
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(`${cluster}/add`);
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
      'stream-channels': 'false',
      progress: 'false',
      'replication-min': '-1',
      'replication-max': '-1',
    });
    expect(body).toBeInstanceOf(FormData);
    expect(await (body.get('file') as File).text()).toBe('hello');
    expect((body.get('file') as File).name).toBe('hello.txt');
    expect(config).toMatchObject({
      auth: { username: 'voltaire', password: 'sentinel-secret' },
      maxRedirects: 0,
      timeout: 120_000,
    });
  });

  it.each([
    Buffer.from('hello'),
    new Uint8Array(Buffer.from('hello')),
    new Blob(['hello']),
    {
      buffer: Buffer.from('hello'),
      originalname: 'hello.txt',
      mimetype: 'text/plain',
    },
  ])('normalizes binary and Multer attachments to multipart', async (input) => {
    const { service, http } = setup();
    http.post.mockReturnValue(ok([{ cid, name: 'hello.txt', size: 5 }]));
    await service.uploadAttachmentToIPFS(input as Express.Multer.File);
    const body = http.post.mock.calls[0][1] as FormData;
    expect(await (body.get('file') as File).text()).toBe('hello');
  });

  it.each([
    { result: [] },
    { result: [{ name: 'missing-cid' }] },
    { result: [{ cid, size: -1 }] },
  ])(
    'falls back on malformed add results and pins Blockfrost uploads',
    async ({ result }) => {
      const { service, http } = setup();
      http.post
        .mockReturnValueOnce(ok(result))
        .mockReturnValueOnce(fail())
        .mockReturnValueOnce(ok({ ipfs_hash: cid, name: 'hello.txt', size: 5 }))
        .mockReturnValueOnce(ok({}));
      const form = new FormData();
      form.append('file', new Blob(['hello']), 'hello.txt');
      expect(await service.uploadAttachmentToIPFS(form)).toMatchObject({
        ipfs_hash: cid,
        state: 'queued',
      });
      expect(http.post.mock.calls[1][0]).toBe('https://primary.test/ipfs/add');
      expect(http.post.mock.calls[2][2]).toMatchObject({
        headers: { project_id: 'fallback-key' },
      });
      expect(http.post.mock.calls[3][0]).toContain(`${cluster}/pins/${cid}`);
    },
  );

  it('queues cluster pins and unpins via REST, never Kubo RPC', async () => {
    const { service, http } = setup();
    http.post.mockReturnValue(ok({}));
    http.delete.mockReturnValue(ok({}));
    expect(await service.pinAttachmentToIPFS(cid)).toEqual({
      ipfs_hash: cid,
      state: 'queued',
    });
    expect(http.post.mock.calls[0][0]).toContain(`${cluster}/pins/${cid}`);
    expect(await service.unpinAttachmentFromIPFS(cid)).toEqual({
      ipfs_hash: cid,
      state: 'unpinned',
    });
    expect(http.delete).toHaveBeenCalledWith(
      `${cluster}/pins/${cid}`,
      expect.objectContaining({
        auth: { username: 'voltaire', password: 'sentinel-secret' },
      }),
    );
  });

  it.each([
    ['pinned', 'pinned'],
    ['pinning', 'queued'],
    ['pin_queued', 'queued'],
    ['pin_error', 'failed'],
    ['cluster_error', 'failed'],
    ['unpinned', 'queued'],
  ])('aggregates peer status %s as %s', async (status, expected) => {
    const { service, http } = setup();
    http.get.mockReturnValue(
      ok({
        peer_map: {
          a: { status: 'pinned' },
          b: { status },
          c: { status: 'pinned' },
        },
      }),
    );
    expect(await service.checkPinStatus(cid)).toMatchObject({
      ipfs_hash: cid,
      state: expected,
    });
    expect(http.get.mock.calls[0][0]).toBe(`${cluster}/pins/${cid}`);
  });

  it('does not mistake an empty peer map for a fully pinned cluster', async () => {
    const { service, http } = setup();
    http.get.mockReturnValue(ok({ peer_map: {} }));
    expect(await service.checkPinStatus(cid)).toMatchObject({
      state: 'queued',
    });
  });

  it.each(['pin', 'status', 'unpin'])(
    'keeps Blockfrost fallbacks for %s',
    async (operation) => {
      const { service, http } = setup();
      const result = { ipfs_hash: cid, state: 'pinned' };
      http.post
        .mockReturnValueOnce(fail())
        .mockReturnValueOnce(fail())
        .mockReturnValueOnce(ok(result));
      http.get
        .mockReturnValueOnce(fail())
        .mockReturnValueOnce(fail())
        .mockReturnValueOnce(ok(result));
      http.delete.mockReturnValueOnce(fail());
      if (operation === 'unpin')
        http.post
          .mockReset()
          .mockReturnValueOnce(fail())
          .mockReturnValueOnce(ok(result));
      const response =
        operation === 'pin'
          ? await service.pinAttachmentToIPFS(cid)
          : operation === 'status'
            ? await service.checkPinStatus(cid)
            : await service.unpinAttachmentFromIPFS(cid);
      expect(response).toEqual(result);
    },
  );

  it('streams gateway content and falls back without forwarding cluster auth', async () => {
    const { service, http } = setup();
    const pipe = jest.fn().mockReturnValue('streamed');
    http.get.mockReturnValueOnce(fail()).mockReturnValueOnce(
      of({
        data: { pipe },
        headers: { 'content-type': 'text/plain' },
      } as unknown as AxiosResponse<unknown>),
    );
    const res = { setHeader: jest.fn() };
    expect(
      await service.getAttachmentFromIPFS(cid, res as unknown as Response),
    ).toBe('streamed');
    expect(http.get.mock.calls[0][0]).toBe(`${gateway}/ipfs/${cid}`);
    expect(http.get.mock.calls[1][1]).toMatchObject({
      responseType: 'stream',
      headers: { project_id: 'primary-key' },
    });
    expect(pipe).toHaveBeenCalledWith(res);
  });

  it('keeps Blockfrost-only uploads working and ignores the retired RPC setting', async () => {
    const { service, http } = setup({
      IPFS_CLUSTER_API_URL: '',
      IPFS_CLUSTER_API_USER: '',
      IPFS_CLUSTER_API_PASSWORD: '',
      IPFS_KUBO_API_URL: 'http://retired:5001',
    });
    http.post
      .mockReturnValueOnce(ok({ ipfs_hash: cid, name: 'file', size: 0 }))
      .mockReturnValueOnce(ok({ ipfs_hash: cid, state: 'pinned' }));
    expect(await service.uploadAttachmentToIPFS(Buffer.alloc(0))).toMatchObject(
      { ipfs_hash: cid, state: 'pinned' },
    );
    expect(http.post.mock.calls.map(([url]) => url)).toEqual([
      'https://primary.test/ipfs/add',
      `https://primary.test/ipfs/pin/add/${cid}`,
    ]);
  });

  it('rejects ambiguous multipart uploads before sending data', async () => {
    const { service, http } = setup();
    const form = new FormData();
    form.append('file', new Blob(['one']));
    form.append('file', new Blob(['two']));
    await expect(service.uploadAttachmentToIPFS(form)).rejects.toThrow(
      'Expected one attachment file',
    );
    expect(http.post).not.toHaveBeenCalled();
  });

  it('logs the upstream status or error code without the error message', async () => {
    const { service, http } = setup();
    http.get
      .mockReturnValueOnce(
        throwError(() =>
          Object.assign(new Error('sentinel-secret'), {
            response: { status: 401 },
          }),
        ),
      )
      .mockReturnValueOnce(
        throwError(() =>
          Object.assign(new Error('sentinel-secret'), { code: 'ECONNABORTED' }),
        ),
      )
      .mockReturnValueOnce(fail());
    await expect(service.getIPFSContent(cid)).rejects.toThrow(HttpException);
    expect(warn.mock.calls.map((call: unknown[]) => call[0])).toEqual([
      'IPFS [cluster-gateway] failed: 401',
      'IPFS [bf-primary] failed: ECONNABORTED',
      'IPFS [bf-fallback] failed: error',
    ]);
  });

  it.each(['../../api/v0/id', `${cid}/%2e%2e/x`, `${cid}?filename=x`, ''])(
    'rejects unsafe IPFS path %p before calling any upstream',
    async (path) => {
      const { service, http } = setup();
      await expect(service.getIPFSContent(path)).rejects.toThrow(
        'Invalid IPFS path',
      );
      await expect(
        service.getAttachmentFromIPFS(path, {} as Response),
      ).rejects.toThrow('Invalid IPFS path');
      expect(http.get).not.toHaveBeenCalled();
    },
  );

  it('reads IPFS paths below a CID through the gateway', async () => {
    const { service, http } = setup();
    http.get.mockReturnValue(ok({ title: 'metadata' }));
    await service.getIPFSContent(`${cid}/metadata.jsonld`);
    expect(http.get.mock.calls[0][0]).toBe(
      `${gateway}/ipfs/${cid}/metadata.jsonld`,
    );
  });

  it('sanitizes upstream errors in logs and client responses', async () => {
    const { service, http } = setup();
    http.get.mockReturnValue(fail());
    await expect(service.getIPFSContent(cid)).rejects.toThrow(HttpException);
    try {
      await service.getIPFSContent(cid);
    } catch (error) {
      expect(JSON.stringify(error)).not.toContain('sentinel-secret');
    }
    expect(JSON.stringify(warn.mock.calls)).not.toContain('sentinel-secret');
  });
});
