/** Dedicated loopback Redis ONLY: QUOTA_TEST_REDIS_PORT=56439 yarn ts-node test/quota-bullmq.integration.ts */
import * as assert from 'node:assert/strict';
import { Queue, QueueEvents, Worker } from 'bullmq';
import { ProviderDeferred } from '../src/blockfrost/request-budget';
import { delayBatch } from '../src/blockfrost/sync-run';

async function main() {
  const port = Number(process.env.QUOTA_TEST_REDIS_PORT);
  assert(
    Number.isInteger(port) && port > 1024,
    'Requires explicit isolated Redis port',
  );
  const host = process.env.QUOTA_TEST_REDIS_HOST || '127.0.0.1';
  assert(
    host === '127.0.0.1' || (process.env.CI === 'true' && host === 'redis'),
    'Requires isolated local or CI Redis',
  );
  const connection = { host, port };
  const name = `quota-test-${Date.now()}`;
  const queue = new Queue(name, { connection });
  const events = new QueueEvents(name, { connection });
  const attempts: number[] = [],
    ids: string[] = [];
  const worker = new Worker(
    name,
    async (job, token) => {
      ids.push(job.id);
      attempts.push(job.attemptsMade);
      if (ids.length <= 3)
        return delayBatch(
          job,
          token,
          new ProviderDeferred('test', 'budget', Date.now() + 1000),
        );
      return { success: true };
    },
    { connection },
  );
  try {
    await events.waitUntilReady();
    const job = await queue.add('resume', {}, { attempts: 1 });
    await job.waitUntilFinished(events, 20000);
    assert.deepEqual(
      attempts,
      [0, 0, 0, 0],
      'intentional delays must not exhaust attempts',
    );
    assert.equal(new Set(ids).size, 1, 'same job resumes each time');
    const saved = await queue.getJob(job.id);
    assert.equal(await saved!.getState(), 'completed');
    assert.equal(await queue.getFailedCount(), 0);
    console.log(
      'PASS: actual BullMQ same-job deferral resumes three times with attempts=1; no failed job',
    );
  } finally {
    await worker.close();
    await events.close();
    await queue.obliterate({ force: true });
    await queue.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
