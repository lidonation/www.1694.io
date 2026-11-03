import { DelayedError, Job } from 'bullmq';
import { delayBatch } from './sync-run';
import { ProviderDeferred } from './request-budget';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('durable deferral contract', () => {
  it('moves the same job to delayed and uses BullMQ control flow, not a failed attempt', async () => {
    const job = {
      id: 'test',
      queueName: 'governance-sync',
      updateProgress: jest.fn(),
      moveToDelayed: jest.fn(),
    };
    const at = Date.now() + 86400000;
    await expect(
      delayBatch(
        job as unknown as Job,
        'lock-token',
        new ProviderDeferred('shared', 'quota', at),
      ),
    ).rejects.toBeInstanceOf(DelayedError);
    expect(job.updateProgress).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'deferred', reason: 'quota' }),
    );
    expect(job.moveToDelayed).toHaveBeenCalledWith(
      expect.any(Number),
      'lock-token',
    );
    expect(job.moveToDelayed.mock.calls[0][0]).toBeGreaterThanOrEqual(at);
  });
  it('keeps the two independently-built budget implementations identical', () => {
    const backend = readFileSync(
      resolve(__dirname, '../../../backend/src/blockfrost/request-budget.ts'),
      'utf8',
    );
    expect(readFileSync(resolve(__dirname, 'request-budget.ts'), 'utf8')).toBe(
      backend,
    );
  });
});
