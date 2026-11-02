import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { ProviderDeferred } from './request-budget';
import { BlockfrostService } from './blockfrost.service';

const gateway =
  'http://koios-gateway-preview-koios-gateway.koios-gateway.svc.cluster.local/api/v0';
const settings = {
  CARDANO_API_URL: `${gateway}/`,
  CARDANO_API_PROJECT_ID: 'gateway-key',
  BLOCKFROST_NETWORK_URL: 'https://legacy.test/api/v0',
  BLOCKFROST_NETWORK_PROJECT_ID: 'legacy-key',
  BLOCKFROST_NETWORK_URL_FALLBACK: 'https://fallback.test/api/v0',
  BLOCKFROST_NETWORK_PROJECT_ID_FALLBACK: 'fallback-key',
};

function setup(overrides: Record<string, string> = {}) {
  const config = new ConfigService({ ...settings, ...overrides });
  const http = { get: jest.fn(), post: jest.fn() };
  const service = new BlockfrostService(
    config,
    http as unknown as HttpService,
    {
      scope: () => 'shared',
      acquire: async () => undefined,
      failure: async (_scope: string, e: any) =>
        e.response?.status === 404
          ? Object.assign(new Error('not found'), { status: 404 })
          : new ProviderDeferred(
              'shared',
              e.response?.status === 429 ? 'throttle' : 'transient',
              Date.now() + 60000,
              e.response?.status || 503,
            ),
    } as any,
  );
  return { service, http };
}

describe('Cardano gateway routing', () => {
  it.each([
    ['getLatestBlock', [], '/blocks/latest'],
    ['getLatestEpoch', [], '/epochs/latest'],
    ['getEpochParameters', [], '/epochs/latest/parameters'],
    ['getAddressUtxos', ['addr_test1'], '/addresses/addr_test1/utxos'],
    ['getDRepInfo', ['drep1'], '/governance/dreps/drep1'],
    [
      'getAllDRepsWithPagination',
      [2, 50, 'desc'],
      '/governance/dreps?page=2&count=50&order=desc',
    ],
    [
      'getProposalVotes',
      ['hash', 3, 2, 50, 'asc'],
      '/governance/proposals/hash/3/votes?page=2&count=50&order=asc',
    ],
    ['getTransaction', ['hash'], '/txs/hash'],
  ] as const)(
    'routes %s through the authenticated gateway without changing its response',
    async (method, args, endpoint) => {
      const { service, http } = setup();
      const payload =
        method === 'getDRepInfo'
          ? { amount: '9007199254740993' }
          : [{ amount: '9007199254740993', tx_hash: 'hash' }];
      http.get.mockReturnValue(of({ data: payload }));
      // A heterogeneous table exercises the same transport contract for each public method.
      const call = service[method] as (
        ...params: (string | number)[]
      ) => Promise<unknown>;
      await expect(call.apply(service, [...args])).resolves.toBe(payload);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(
        `${gateway}${endpoint}`,
        expect.objectContaining({ headers: { project_id: 'gateway-key' } }),
      );
    },
  );

  it('keeps CBOR submission binary and authenticated', async () => {
    const { service, http } = setup();
    http.post.mockReturnValue(of({ data: 'txhash' }));
    await expect(service.submitTransaction('a100')).resolves.toBe('txhash');
    expect(http.post).toHaveBeenCalledWith(
      `${gateway}/tx/submit`,
      Buffer.from('a100', 'hex'),
      expect.objectContaining({
        headers: {
          project_id: 'gateway-key',
          'Content-Type': 'application/cbor',
        },
      }),
    );
  });

  it('keeps the existing fallback key separate from the gateway key', async () => {
    const { service, http } = setup();
    (service as any).budget.scope = (route: string) => route;
    http.get
      .mockReturnValueOnce(
        throwError(() => ({ response: { status: 403, data: 'denied' } })),
      )
      .mockReturnValueOnce(of({ data: { epoch: 500 } }));
    await expect(service.getLatestEpoch()).resolves.toEqual({ epoch: 500 });
    expect(http.get).toHaveBeenNthCalledWith(
      2,
      'https://fallback.test/api/v0/epochs/latest',
      expect.objectContaining({ headers: { project_id: 'fallback-key' } }),
    );
  });

  it.each(['CARDANO_API_URL', 'CARDANO_API_PROJECT_ID'])(
    'rejects an incomplete gateway pair missing %s',
    (key) => {
      expect(() => setup({ [key]: '' })).toThrow(
        'CARDANO_API_URL and CARDANO_API_PROJECT_ID must be configured together',
      );
    },
  );

  it.each([
    '/api/v0',
    'not-a-url',
    'ftp://gateway.test/api/v0',
    'https://user:password@gateway.test/api/v0',
    'https://gateway.test/api/v0?token=hidden',
    'https://gateway.test/api/v0#ignored',
  ])('rejects an unsafe gateway base URL: %s', (url) => {
    expect(() => setup({ CARDANO_API_URL: url })).toThrow(
      'CARDANO_API_URL must be an HTTP(S) base URL without credentials, query or fragment',
    );
  });

  it('trims gateway configuration without changing endpoint paths', async () => {
    const { service, http } = setup({
      CARDANO_API_URL: `  ${gateway}///  `,
      CARDANO_API_PROJECT_ID: '  gateway-key  ',
    });
    http.get.mockReturnValue(of({ data: { epoch: 500 } }));
    await service.getLatestEpoch();
    expect(http.get).toHaveBeenCalledWith(
      `${gateway}/epochs/latest`,
      expect.objectContaining({ headers: { project_id: 'gateway-key' } }),
    );
  });

  it('retains legacy primary configuration outside the chart', async () => {
    const { service, http } = setup({
      CARDANO_API_URL: '',
      CARDANO_API_PROJECT_ID: '',
    });
    http.get.mockReturnValue(of({ data: { epoch: 500 } }));
    await service.getLatestEpoch();
    expect(http.get).toHaveBeenCalledWith(
      'https://legacy.test/api/v0/epochs/latest',
      expect.objectContaining({ headers: { project_id: 'legacy-key' } }),
    );
  });
});

describe('Gateway indexing safeguards', () => {
  it('does not turn an authoritative 404 into fallback data', async () => {
    const { service, http } = setup();
    http.get.mockReturnValue(
      throwError(() => ({ response: { status: 404, data: 'missing' } })),
    );
    await expect(service.getDRepInfo('missing')).rejects.toMatchObject({
      status: 404,
    });
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('defers throttling instead of immediately retrying the primary', async () => {
    const { service, http } = setup();
    http.get.mockReturnValue(throwError(() => ({ response: { status: 429 } })));
    await expect(service.getLatestEpoch()).rejects.toBeInstanceOf(
      ProviderDeferred,
    );
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('denies stale primary epochs before updating voting power', async () => {
    const { service, http } = setup();
    http.get
      .mockReturnValueOnce(of({ data: { epoch: 499 } }))
      .mockReturnValueOnce(of({ data: { epoch: 500 } }));
    await expect(service.assertGovernanceSourceFresh()).resolves.toMatchObject({
      ok: false,
      epoch: 499,
    });
    expect(http.get.mock.calls.map(([url]) => url as string)).toEqual([
      `${gateway}/epochs/latest`,
      'https://fallback.test/api/v0/epochs/latest',
    ]);
  });

  it('denies a primary without a valid epoch', async () => {
    const { service, http } = setup();
    http.get.mockReturnValue(of({ data: {} }));
    await expect(service.assertGovernanceSourceFresh()).resolves.toMatchObject({
      ok: false,
    });
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('allows a fresh primary when the comparison source is transiently unavailable', async () => {
    jest.useFakeTimers();
    try {
      const { service, http } = setup();
      http.get
        .mockReturnValueOnce(of({ data: { epoch: 500 } }))
        .mockReturnValue(throwError(() => ({ response: { status: 503 } })));
      const result = service.assertGovernanceSourceFresh();
      await jest.runAllTimersAsync();
      await expect(result).resolves.toEqual({ ok: true, epoch: 500 });
    } finally {
      jest.useRealTimers();
    }
  });

  it.each(['ipfs-key', ''])(
    'never sends the gateway key to IPFS (IPFS key: %s)',
    async (ipfsKey) => {
      const { service, http } = setup({ BLOCKFROST_IPFS_PROJECT_ID: ipfsKey });
      const payload = Buffer.from('metadata');
      http.get.mockReturnValue(of({ data: payload }));
      await expect(service.getIpfsContent('cid')).resolves.toBe(payload);
      expect(http.get).toHaveBeenCalledWith(
        'https://ipfs.blockfrost.io/api/v0/ipfs/get/cid',
        expect.objectContaining({
          headers: { project_id: ipfsKey || 'legacy-key' },
          responseType: 'arraybuffer',
        }),
      );
    },
  );
});
