import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { BlockfrostService } from './blockfrost.service';
import { ProviderDeferred, retryAfter } from './request-budget';

const settings = {
  CARDANO_API_URL: 'http://gateway.test/api/v0',
  CARDANO_API_PROJECT_ID: 'primary-secret',
  BLOCKFROST_NETWORK_URL_FALLBACK: 'https://hosted.test/api/v0',
  BLOCKFROST_NETWORK_PROJECT_ID_FALLBACK: 'fallback-secret',
};
function setup(independent = false) {
  const http = { get: jest.fn(), post: jest.fn() };
  const blocked = new Map<string, ProviderDeferred>();
  const budget = {
    scope: (route: string) => (independent ? route : 'shared'),
    acquire: jest.fn(async (scope: string) => {
      if (blocked.has(scope)) throw blocked.get(scope);
    }),
    failure: jest.fn(async (scope: string, error: any) => {
      const status = error.response?.status || 503;
      if (status === 404)
        return Object.assign(new Error('not found'), { status });
      const e = new ProviderDeferred(
        scope,
        status === 402
          ? 'quota'
          : status === 429
            ? 'throttle'
            : status === 403
              ? 'authentication'
              : 'transient',
        Date.now() + 60000,
        status,
      );
      blocked.set(scope, e);
      return e;
    }),
  };
  const service = new BlockfrostService(
    new ConfigService(settings),
    http as unknown as HttpService,
    budget as any,
  );
  return { service, http, budget };
}
describe('quota-aware physical dispatch', () => {
  it.each([402, 429, 401, 403, 418])(
    'stops shared fallback and later entities after HTTP %i',
    async (status) => {
      const { service, http } = setup();
      http.get.mockReturnValue(
        throwError(() => ({
          response: { status, data: 'sensitive upstream payload' },
        })),
      );
      await expect(
        service.getDRepInfo('private-wallet'),
      ).rejects.toBeInstanceOf(ProviderDeferred);
      await expect(
        service.getDRepInfo('another-wallet'),
      ).rejects.toBeInstanceOf(ProviderDeferred);
      expect(http.get).toHaveBeenCalledTimes(1);
    },
  );
  it('uses a verified independent fallback after primary quota exhaustion', async () => {
    const { service, http } = setup(true);
    http.get
      .mockReturnValueOnce(throwError(() => ({ response: { status: 402 } })))
      .mockReturnValueOnce(of({ data: { epoch: 600 } }));
    await expect(service.getLatestEpoch()).resolves.toEqual({ epoch: 600 });
    expect(http.get).toHaveBeenCalledTimes(2);
  });
  it.each([402, 429, 503, 'timeout'])(
    'dispatches a transaction only once on %s',
    async (status) => {
      const { service, http } = setup(true);
      http.post.mockReturnValue(
        throwError(() => ({
          code: 'ETIMEDOUT',
          response: typeof status === 'number' ? { status } : undefined,
        })),
      );
      await expect(service.submitTransaction('a100')).rejects.toThrow();
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.get).not.toHaveBeenCalled();
    },
  );
  it('bounds transient retries and charges every attempt', async () => {
    jest.useFakeTimers();
    try {
      const { service, http, budget } = setup();
      http.get.mockReturnValue(
        throwError(() => ({ response: { status: 503 } })),
      );
      const result = service.getLatestEpoch().catch((e) => e);
      await jest.runAllTimersAsync();
      expect(await result).toBeInstanceOf(ProviderDeferred);
      expect(http.get).toHaveBeenCalledTimes(3);
      expect(budget.acquire).toHaveBeenCalledTimes(3);
    } finally {
      jest.useRealTimers();
    }
  });
  it('never treats a malformed list response as an empty delegation snapshot', async () => {
    jest.useFakeTimers();
    try {
      const { service, http } = setup();
      http.get.mockReturnValue(of({ data: null }));
      const result = service
        .getDRepDelegators('private-wallet')
        .catch((e) => e);
      await jest.runAllTimersAsync();
      expect(await result).toBeInstanceOf(ProviderDeferred);
      expect(http.get).toHaveBeenCalledTimes(3);
    } finally {
      jest.useRealTimers();
    }
  });
  it('rejects malformed DRep amounts before caching or writing defaults', async () => {
    jest.useFakeTimers();
    try {
      const { service, http } = setup();
      http.get.mockReturnValue(of({ data: { amount: '' } }));
      const result = service.getDRepInfo('private-wallet').catch((e) => e);
      await jest.runAllTimersAsync();
      expect(await result).toBeInstanceOf(ProviderDeferred);
      expect(http.get).toHaveBeenCalledTimes(3);
    } finally {
      jest.useRealTimers();
    }
  });
  it('parses Retry-After seconds/dates and rejects malformed values', () => {
    const now = Date.parse('2026-11-02T12:00:00Z');
    expect(retryAfter('120', now)).toBe(now + 120000);
    expect(retryAfter('Mon, 02 Nov 2026 12:05:00 GMT', now)).toBe(now + 300000);
    expect(retryAfter('invalid', now)).toBeUndefined();
    expect(retryAfter('-1', now)).toBeUndefined();
  });
});
