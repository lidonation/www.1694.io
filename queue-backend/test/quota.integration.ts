/** Dedicated local database ONLY: QUOTA_TEST_DB_URL=postgres://postgres@127.0.0.1:55439/postgres yarn ts-node test/quota.integration.ts */
import 'reflect-metadata';
import * as assert from 'node:assert/strict';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  RequestBudget,
  ProviderDeferred,
} from '../src/blockfrost/request-budget';
import {
  runBatch,
  staged,
  syncItem,
  stakeEpoch,
  multiDaySnapshot,
  batchDatabase,
  batchAdmission,
} from '../src/blockfrost/sync-run';
import { CardanoRequestBudget1793611800000 } from '../../backend/src/migrations/1793611800000-CardanoRequestBudget';

async function main() {
  const url = process.env.QUOTA_TEST_DB_URL;
  assert(
    url &&
      (new URL(url).hostname === '127.0.0.1' ||
        (process.env.CI === 'true' && new URL(url).hostname === 'postgres')),
    'Requires a dedicated local or CI test database',
  );
  const schema = `quota_test_${Date.now()}`;
  const admin = await new DataSource({ type: 'postgres', url }).initialize();
  await admin.query(`CREATE SCHEMA ${schema}`);
  const db = await new DataSource({
    type: 'postgres',
    url,
    extra: { options: `-c search_path=${schema} -c timezone=Pacific/Auckland` },
  }).initialize();
  try {
    const runner = db.createQueryRunner();
    await runner.connect();
    await new CardanoRequestBudget1793611800000().up(runner as any);
    await runner.release();
    const config = (limit: number, batch = limit) =>
      new ConfigService({
        CARDANO_QUOTA_RESET_UTC_HOUR: '0',
        CARDANO_DAILY_LIMIT: String(limit),
        CARDANO_BATCH_DAILY_LIMIT: String(batch),
      });
    const budget = new RequestBudget(config(7), db),
      secondClient = new RequestBudget(config(7), db);
    const admissions = await Promise.allSettled(
      Array.from({ length: 30 }, (_, i) =>
        (i % 2 ? budget : secondClient).acquire('race', true),
      ),
    );
    assert.equal(
      admissions.filter((r) => r.status === 'fulfilled').length,
      7,
      'atomic cap across two client instances',
    );
    assert.equal(
      (
        await db.query(
          "SELECT used FROM cardano_request_budget WHERE scope='race'",
        )
      )[0].used,
      7,
    );
    await assert.rejects(
      budget.acquire('independent-route', true),
      ProviderDeferred,
    );
    await db.query(
      "DELETE FROM cardano_request_budget WHERE scope='@application'",
    );
    await new RequestBudget(config(10, 2), db).acquire('headroom', true);
    await new RequestBudget(config(10, 2), db).acquire('headroom', true);
    await assert.rejects(
      new RequestBudget(config(10, 2), db).acquire('headroom', true),
      ProviderDeferred,
    );
    await new RequestBudget(config(10, 2), db).acquire('headroom', false);
    assert.equal(
      new Date(
        (
          await db.query(
            "SELECT period_start FROM cardano_request_budget WHERE scope='headroom'",
          )
        )[0].period_start,
      ).getUTCHours(),
      0,
      'reset hour is UTC regardless of database session timezone',
    );
    const exhausted = await budget.failure('race', {
      response: { status: 402, headers: { 'retry-after': '172800' } },
    });
    assert(exhausted instanceof ProviderDeferred);
    assert(exhausted.retryAt >= Date.now() + 172799000);
    await db.query(
      "UPDATE cardano_request_budget SET period_start='epoch' WHERE scope='race'",
    );
    await assert.rejects(
      budget.acquire('race', true),
      ProviderDeferred,
      'cooldown survives a daily reset',
    );
    await assert.rejects(
      new RequestBudget(config(0), db).acquire('unconfigured', true),
      ProviderDeferred,
    );
    assert.throws(
      () =>
        new RequestBudget(new ConfigService({ CARDANO_DAILY_LIMIT: '-1' }), db),
    );
    const same = new RequestBudget(
      new ConfigService({
        CARDANO_API_PROJECT_ID: 'same',
        BLOCKFROST_NETWORK_PROJECT_ID_FALLBACK: 'same',
        CARDANO_QUOTA_PRIMARY_SCOPE: 'one',
        CARDANO_QUOTA_FALLBACK_SCOPE: 'two',
      }),
      db,
    );
    assert.equal(same.scope('fallback', 'same'), 'one');

    await db.query(
      'CREATE TABLE fixture(id text PRIMARY KEY, value integer NOT NULL)',
    );
    await db.query(
      "DELETE FROM cardano_request_budget WHERE scope='@application'",
    );
    const one = new RequestBudget(config(1), db);
    let requests = 0,
      writes = 0;
    const job: any = {
      id: 'run',
      queueName: 'integration',
      data: {},
      updateProgress: async () => undefined,
      updateData: async function (data: any) {
        this.data = data;
      },
    };
    const fetch = (key: string) =>
      staged(`request:${key}`, async () => {
        await one.acquire('multi-day', true);
        requests++;
        return key;
      });
    const work = async () => {
      const a = await syncItem('a', async () => {
        await fetch('a');
        await batchDatabase(db).query(
          "INSERT INTO fixture VALUES('a',1) ON CONFLICT(id) DO UPDATE SET value=1",
        );
        writes++;
        return 1;
      });
      const b = await syncItem('b', async () => {
        await fetch('b-one');
        await fetch('b-two');
        await batchDatabase(db).query(
          "INSERT INTO fixture VALUES('b',1) ON CONFLICT(id) DO UPDATE SET value=1",
        );
        writes++;
        return 1;
      });
      return { success: true, count: a + b };
    };
    for (let day = 1; day <= 2; day++) {
      await assert.rejects(
        runBatch(db, job, undefined, work),
        ProviderDeferred,
      );
      assert.equal(requests, day);
      await db.query(
        "UPDATE cardano_request_budget SET period_start='epoch',blocked_until='epoch' WHERE scope IN ('multi-day','@application')",
      );
      await db.query('UPDATE cardano_sync_run SET next_run_at=NULL');
    }
    const result = await runBatch(db, job, undefined, work);
    assert.equal(result.count, 2);
    assert.equal(requests, 3);
    assert.equal(writes, 2);
    assert.equal((await db.query('SELECT * FROM fixture')).length, 2);
    await runBatch(db, job, undefined, async () => {
      throw new Error('finished continuation must not replay');
    });

    // A different trigger adopts the existing durable run instead of starting from page one.
    const first: any = { ...job, id: 'first', queueName: 'adopt', data: {} };
    await assert.rejects(
      runBatch(db, first, undefined, async () => {
        await staged('partial', async () => 'saved');
        throw new ProviderDeferred('x', 'quota', Date.now() + 1000);
      }),
      ProviderDeferred,
    );
    await db.query('UPDATE cardano_sync_run SET next_run_at=NULL');
    const next: any = { ...first, id: 'next', data: {} };
    await runBatch(db, next, undefined, async () => {
      assert.equal(
        await staged('partial', async () => {
          throw new Error('lost staging');
        }),
        'saved',
      );
      return { success: true };
    });
    assert.equal(first.data.cardanoRunId, next.data.cardanoRunId);

    const epochJob: any = { ...job, queueName: 'epochs', data: {} };
    await runBatch(db, epochJob, undefined, async () => {
      await stakeEpoch(600);
      await staged('old-power', async () => 'old');
      await stakeEpoch(601);
      assert.equal(await staged('old-power', async () => 'new'), 'new');
      return { success: true };
    });
    const oldJob: any = { ...job, queueName: 'old-snapshot', data: {} };
    await assert.rejects(
      runBatch(db, oldJob, undefined, async () => {
        throw new ProviderDeferred('x', 'quota', Date.now() + 1000);
      }),
      ProviderDeferred,
    );
    await db.query(
      "UPDATE cardano_sync_run SET started_at=now()-interval '2 days',next_run_at=NULL WHERE scope='old-snapshot:all'",
    );
    await runBatch(db, oldJob, undefined, async () => {
      assert.equal(multiDaySnapshot(), true);
      return { success: true };
    });

    // Failed transactions roll back BOTH application writes and checkpoints. A Redis run ID
    // written before a database rollback must not cause the continuation to be skipped.
    const crash: any = { ...job, queueName: 'rollback', data: {} };
    await assert.rejects(
      runBatch(db, crash, undefined, async () => {
        await syncItem('atomic', async () => {
          await batchDatabase(db).query(
            "INSERT INTO fixture VALUES('crash',1)",
          );
          return 1;
        });
        throw new Error('simulated process failure');
      }),
      /simulated process failure/,
    );
    assert.equal(
      (await db.query("SELECT * FROM fixture WHERE id='crash'")).length,
      0,
    );
    await runBatch(db, crash, undefined, async () => {
      await syncItem('atomic', async () => {
        await batchDatabase(db).query("INSERT INTO fixture VALUES('crash',1)");
        return 1;
      });
      return { success: true };
    });
    assert.equal(
      (await db.query("SELECT * FROM fixture WHERE id='crash'")).length,
      1,
    );
    const chunk: any = { ...job, queueName: 'bounded-chunks', data: {} };
    let dispatched = 0;
    const chunkWork = async () => {
      for (let i = 0; i < 51; i++)
        await staged(`chunk-${i}`, async () => {
          batchAdmission();
          dispatched++;
          return i;
        });
      return { success: true };
    };
    await assert.rejects(
      runBatch(db, chunk, undefined, chunkWork),
      ProviderDeferred,
    );
    assert.equal(dispatched, 50);
    await db.query(
      "UPDATE cardano_sync_run SET next_run_at=NULL WHERE scope='bounded-chunks:all'",
    );
    await runBatch(db, chunk, undefined, chunkWork);
    assert.equal(
      dispatched,
      51,
      'completed requests are not dispatched again after a chunk boundary',
    );

    // Global writer lock rejects overlapping scopes before any provider work.
    const lock = db.createQueryRunner();
    await lock.connect();
    await lock.startTransaction();
    await lock.query('SELECT pg_advisory_xact_lock(169480002)');
    const busy: any = { ...job, queueName: 'busy', data: {} };
    await assert.rejects(
      runBatch(db, busy, undefined, async () => {
        throw new Error('concurrent work');
      }),
      ProviderDeferred,
    );
    await lock.rollbackTransaction();
    await lock.release();
    console.log(
      'PASS: atomic admissions, shared cooldown, headroom, fail-closed config, multi-day mid-item resume, coalescing, epoch rollover, multi-day snapshot guard, writer exclusion',
    );
  } finally {
    await db.destroy();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.destroy();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
