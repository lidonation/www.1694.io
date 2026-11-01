import { HttpService } from '@nestjs/axios';
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
  BLOCKFROST_NETWORK_URL_FALLBACK: 'https://fallback.test/api/v0',
  BLOCKFROST_NETWORK_PROJECT_ID_FALLBACK: 'fallback-key',
};

function setup(overrides: Record<string, string> = {}) {
  const config = new ConfigService({ ...settings, ...overrides });
  const http = { get: jest.fn(), post: jest.fn() };
  const service = new BlockfrostService(config, http as unknown as HttpService);
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
      const payload = [{ amount: '9007199254740993', tx_hash: 'hash' }];
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
      {
        headers: {
          project_id: 'gateway-key',
          'Content-Type': 'application/cbor',
        },
      },
    );
  });

  it('keeps the existing fallback key separate from the gateway key', async () => {
    const { service, http } = setup();
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
