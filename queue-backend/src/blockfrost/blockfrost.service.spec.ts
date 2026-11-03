import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { RequestBudget, ProviderDeferred } from './request-budget';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { BlockfrostService } from './blockfrost.service';

const gateway =
  'http://koios-gateway-preview-koios-gateway.koios-gateway.svc.cluster.local/api/v0';
const settings = {
  CARDANO_API_URL: `${gateway}/`,
  CARDANO_API_PROJECT_ID: 'gateway-key',
  BLOCKFROST_NETWORK_URL: 'https://legacy.test/api/v0',
  BLOCKFROST_NETWORK_PROJECT_ID: 'legacy-key',
  BLOCKFROST_NETWORK_URL_FALLBACK:
    'https://cardano-mainnet.blockfrost.io/api/v0',
  BLOCKFROST_NETWORK_PROJECT_ID_FALLBACK: 'fallback-key',
};

function setup(overrides: Record<string, string> = {}, independent = false) {
  const config = new ConfigService({ ...settings, ...overrides });
  const http = { get: jest.fn(), post: jest.fn() };
  const classifier = new RequestBudget(config, {
    query: jest.fn().mockResolvedValue([]),
  } as any);
  const budget = {
    scope: jest.fn((route: string) => (independent ? route : 'shared')),
    acquire: jest.fn(async () => undefined),
    failure: jest.fn((scope: string, error: unknown) =>
      classifier.failure(scope, error),
    ),
  };
  const service = new BlockfrostService(
    config,
    http as unknown as HttpService,
    budget as any,
  );
  return { service, http, budget };
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

  it('keeps legacy fallback credentials separate without gateway mode', async () => {
    const { service, http } = setup(
      {
        CARDANO_API_URL: '',
        CARDANO_API_PROJECT_ID: '',
      },
      true,
    );
    http.get
      .mockReturnValueOnce(
        throwError(() => ({ response: { status: 403, data: 'denied' } })),
      )
      .mockReturnValueOnce(of({ data: { epoch: 500 } }));
    await expect(service.getLatestEpoch()).resolves.toEqual({ epoch: 500 });
    expect(http.get).toHaveBeenNthCalledWith(
      2,
      'https://cardano-mainnet.blockfrost.io/api/v0/epochs/latest',
      expect.objectContaining({ headers: { project_id: 'fallback-key' } }),
    );
  });

  it.each([
    [
      'quota',
      { response: { status: 402, data: 'sensitive quota payload' } },
      402,
      'quota',
      1,
    ],
    [
      'rate limit',
      { response: { status: 429, data: 'sensitive rate payload' } },
      429,
      'throttle',
      1,
    ],
    [
      'authentication',
      { response: { status: 403, data: 'sensitive auth payload' } },
      403,
      'authentication',
      1,
    ],
    [
      'upstream',
      { response: { status: 503, data: 'sensitive upstream payload' } },
      503,
      'transient',
      3,
    ],
    [
      'transport',
      { code: 'ECONNRESET', message: 'sensitive transport payload' },
      503,
      'transient',
      3,
    ],
    [
      'not found',
      { response: { status: 404, data: 'sensitive missing payload' } },
      404,
      undefined,
      1,
    ],
  ] as const)(
    'keeps gateway %s failures within the gateway even with independent legacy scopes',
    async (_name, error, status, reason, attempts) => {
      jest.useFakeTimers();
      try {
        const { service, http, budget } = setup({}, true);
        http.get.mockImplementation((url: string) =>
          url.startsWith(gateway)
            ? throwError(() => error)
            : of({ data: { epoch: 999 } }),
        );
        const result = service.getLatestEpoch().catch((e: unknown) => e);
        await jest.runAllTimersAsync();
        const failure = await result;
        expect(failure).toBeInstanceOf(HttpException);
        expect(failure).toMatchObject({ status });
        if (reason) {
          expect(failure).toBeInstanceOf(ProviderDeferred);
          expect(failure).toMatchObject({ reason, scope: 'primary' });
        }
        expect(JSON.stringify(failure)).not.toContain('sensitive');
        expect(http.get).toHaveBeenCalledTimes(attempts);
        expect(
          http.get.mock.calls.every(
            ([url]) => url === `${gateway}/epochs/latest`,
          ),
        ).toBe(true);
        expect(budget.acquire).toHaveBeenCalledTimes(attempts);
        expect(
          budget.scope.mock.calls.every(([route]) => route === 'primary'),
        ).toBe(true);
      } finally {
        jest.useRealTimers();
      }
    },
  );

  it('does not consult stale fallback quota configuration in gateway mode', () => {
    const { budget } = setup({}, true);
    expect(
      budget.scope.mock.calls.some(([route]) => route === 'fallback'),
    ).toBe(false);
  });

  it.each([402, 429, 503, 'timeout'] as const)(
    'does not retry or fail over a CBOR submission after %s',
    async (status) => {
      const { service, http, budget } = setup({}, true);
      http.post.mockReturnValue(
        throwError(() => ({
          code: 'ETIMEDOUT',
          response: typeof status === 'number' ? { status } : undefined,
        })),
      );
      const failure = await service
        .submitTransaction('a100')
        .catch((e: unknown) => e);
      if (status === 503 || status === 'timeout') {
        expect(failure).toMatchObject({
          status: 503,
          response: { code: 'SUBMISSION_OUTCOME_UNKNOWN' },
        });
      } else {
        expect(failure).toMatchObject({ status });
      }
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(budget.acquire).toHaveBeenCalledTimes(1);
    },
  );

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
  it.each([true, false])(
    'does not turn an authoritative 404 into fallback data (gateway: %s)',
    async (gatewayMode) => {
      const { service, http } = setup(
        gatewayMode ? {} : { CARDANO_API_URL: '', CARDANO_API_PROJECT_ID: '' },
      );
      http.get.mockReturnValue(
        throwError(() => ({ response: { status: 404, data: 'missing' } })),
      );
      await expect(service.getDRepInfo('missing')).rejects.toMatchObject({
        status: 404,
      });
      expect(http.get).toHaveBeenCalledTimes(1);
    },
  );

  it('defers throttling instead of immediately retrying the gateway', async () => {
    const { service, http } = setup({}, true);
    http.get.mockReturnValue(throwError(() => ({ response: { status: 429 } })));
    await expect(service.getLatestEpoch()).rejects.toMatchObject({
      reason: 'throttle',
      status: 429,
    });
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('denies stale gateway epochs using only the gateway block tip', async () => {
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
      `${gateway}/blocks/latest`,
    ]);
  });

  it('retains legacy same-network freshness comparison', async () => {
    const { service, http } = setup({
      CARDANO_API_URL: '',
      CARDANO_API_PROJECT_ID: '',
      BLOCKFROST_NETWORK_URL_FALLBACK: 'https://legacy-tip.test/api/v0',
    });
    http.get
      .mockReturnValueOnce(of({ data: { epoch: 499 } }))
      .mockReturnValueOnce(of({ data: { epoch: 500 } }));
    await expect(service.assertGovernanceSourceFresh()).resolves.toMatchObject({
      ok: false,
      epoch: 499,
    });
    expect(http.get.mock.calls.map(([url]) => url as string)).toEqual([
      'https://legacy.test/api/v0/epochs/latest',
      'https://legacy-tip.test/api/v0/epochs/latest',
    ]);
  });

  it.each([undefined, -1, NaN, 1.5])(
    'denies an invalid primary epoch %s',
    async (epoch) => {
      const { service, http } = setup();
      http.get.mockReturnValue(of({ data: { epoch } }));
      await expect(
        service.assertGovernanceSourceFresh(),
      ).resolves.toMatchObject({
        ok: false,
      });
      expect(http.get).toHaveBeenCalledTimes(1);
    },
  );

  it.each([402, 429, 403])(
    'propagates gateway comparison deferral %s instead of masking an exhausted scope',
    async (status) => {
      const { service, http } = setup({}, true);
      http.get
        .mockReturnValueOnce(of({ data: { epoch: 500 } }))
        .mockReturnValueOnce(throwError(() => ({ response: { status } })));
      await expect(service.assertGovernanceSourceFresh()).rejects.toMatchObject(
        { status, scope: 'primary' },
      );
      expect(http.get.mock.calls.map(([url]) => url)).toEqual([
        `${gateway}/epochs/latest`,
        `${gateway}/blocks/latest`,
      ]);
    },
  );

  it('propagates primary quota deferral without probing another route', async () => {
    const { service, http } = setup({}, true);
    http.get.mockReturnValue(throwError(() => ({ response: { status: 402 } })));
    await expect(service.assertGovernanceSourceFresh()).rejects.toMatchObject({
      reason: 'quota',
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
