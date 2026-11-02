import { ConfigService } from '@nestjs/config';
import { RequestBudget, ProviderDeferred } from './request-budget';

function setup(settings: Record<string, string> = {}) {
  const db = { query: jest.fn().mockResolvedValue([]), transaction: jest.fn() };
  return {
    db,
    budget: new RequestBudget(new ConfigService(settings), db as any),
  };
}
describe('provider error classification and safe configuration', () => {
  it.each([
    [402, 'quota'],
    [429, 'throttle'],
    [401, 'authentication'],
    [403, 'authentication'],
    [418, 'authentication'],
    [503, 'transient'],
  ])(
    'classifies %s without retaining the upstream payload',
    async (status, reason) => {
      const { budget } = setup();
      const error = await budget.failure('shared', {
        response: {
          status,
          data: 'secret-wallet-payload',
          headers: { 'retry-after': '172800' },
        },
      });
      expect(error).toBeInstanceOf(ProviderDeferred);
      expect((error as ProviderDeferred).reason).toBe(reason);
      expect((error as ProviderDeferred).retryAt).toBeGreaterThanOrEqual(
        Date.now() + 172799000,
      );
      expect(JSON.stringify(error)).not.toContain('secret-wallet-payload');
    },
  );
  it('fails closed when allocation or storage is unavailable', async () => {
    const unconfigured = setup();
    await expect(
      unconfigured.budget.acquire('shared', true),
    ).rejects.toMatchObject({ reason: 'configuration' });
    expect(unconfigured.db.transaction).not.toHaveBeenCalled();
    const configured = setup({
      CARDANO_DAILY_LIMIT: '100',
      CARDANO_BATCH_DAILY_LIMIT: '10',
      CARDANO_QUOTA_RESET_UTC_HOUR: '0',
    });
    configured.db.transaction.mockRejectedValue(
      new Error('sensitive database error'),
    );
    await expect(
      configured.budget.acquire('shared', true),
    ).rejects.toMatchObject({ reason: 'configuration' });
  });
  it.each([
    { CARDANO_DAILY_LIMIT: '-1' },
    { CARDANO_DAILY_LIMIT: '80001' },
    { CARDANO_DAILY_LIMIT: '10', CARDANO_BATCH_DAILY_LIMIT: '11' },
    { CARDANO_DAILY_LIMIT: '10' },
    { CARDANO_QUOTA_RESET_UTC_HOUR: '24' },
  ])('rejects unsafe configuration %j', (settings) => {
    expect(() => setup(settings)).toThrow();
  });
  it('does not circuit-break an authoritative 404', async () => {
    const { budget, db } = setup();
    await expect(
      budget.failure('shared', { response: { status: 404 } }),
    ).resolves.toMatchObject({ status: 404 });
    expect(db.query).not.toHaveBeenCalled();
  });
});
