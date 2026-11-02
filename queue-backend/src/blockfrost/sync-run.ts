import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash, randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { DelayedError, Job } from 'bullmq';
import { DataSource, QueryRunner } from 'typeorm';
import { ProviderDeferred } from './request-budget';

const local = new AsyncLocalStorage<{
  runner: QueryRunner;
  id: string;
  started: Date;
  dispatched: number;
  chunkStarted: number;
}>();
const logger = new Logger('CardanoSyncRun');
export const batchDatabase = (db: DataSource) =>
  local.getStore()?.runner.manager || db;
export function batchAdmission(): void {
  const context = local.getStore();
  if (!context) return;
  if (
    context.dispatched >= 50 ||
    (context.dispatched > 0 && Date.now() - context.chunkStarted > 30000)
  )
    throw new ProviderDeferred('batch', 'busy', Date.now() + 1000);
  context.dispatched++;
}
export const inBatch = () => !!local.getStore();
export const multiDaySnapshot = () => {
  const context = local.getStore();
  return (
    !!context &&
    context.started.toISOString().slice(0, 10) !==
      new Date().toISOString().slice(0, 10)
  );
};
export async function staged<T>(
  key: string,
  work: () => Promise<T>,
): Promise<T> {
  const context = local.getStore();
  if (!context) return work();
  const digest = createHash('sha256').update(key).digest('hex');
  const [row] = await context.runner.query(
    'SELECT value FROM cardano_sync_stage WHERE run_id=$1 AND key=$2',
    [context.id, digest],
  );
  if (row)
    return (
      row.value.buffer ? Buffer.from(row.value.data, 'base64') : row.value.data
    ) as T;
  const result = await work();
  const value = Buffer.isBuffer(result)
    ? { buffer: true, data: result.toString('base64') }
    : { data: result ?? null };
  await context.runner.query(
    'INSERT INTO cardano_sync_stage(run_id,key,value) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',
    [context.id, digest, JSON.stringify(value)],
  );
  return result;
}
export const syncItem = <T>(key: string, work: () => Promise<T>) =>
  staged(`item:${key}`, work);
export const targets = <T>(key: string, work: () => Promise<T>) =>
  staged(`targets:${key}`, work);
export async function stakeEpoch(epoch: number): Promise<void> {
  const context = local.getStore();
  if (!context) return;
  const [row] = await context.runner.query(
    'SELECT epoch FROM cardano_sync_run WHERE id=$1',
    [context.id],
  );
  if (row.epoch !== null && row.epoch !== epoch)
    await context.runner.query(
      'DELETE FROM cardano_sync_stage WHERE run_id=$1',
      [context.id],
    );
  await context.runner.query(
    'UPDATE cardano_sync_run SET epoch=$2 WHERE id=$1',
    [context.id, epoch],
  );
}
export async function delayBatch(
  job: Job,
  token: string | undefined,
  error: ProviderDeferred,
): Promise<never> {
  if (!token) throw error;
  // Deferral is not an ordinary failed attempt. BullMQ renews the lock until this transition.
  const jitter =
    parseInt(
      createHash('sha256').update(String(job.id)).digest('hex').slice(0, 4),
      16,
    ) % 1000;
  await job.updateProgress({
    status: 'deferred',
    reason: error.reason,
    nextRunAt: error.retryAt + jitter,
  });
  await job.moveToDelayed(
    Math.max(Date.now() + 1000, error.retryAt) + jitter,
    token,
  );
  logger.warn(`Batch deferred queue=${job.queueName} reason=${error.reason}`);
  throw new DelayedError();
}
export async function runBatch<T>(
  db: DataSource,
  job: Job,
  token: string | undefined,
  work: () => Promise<T>,
): Promise<T> {
  const runner = db.createQueryRunner();
  let locked = false;
  try {
    await runner.connect();
    await runner.startTransaction();
    const [lock] = await runner.query(
      'SELECT pg_try_advisory_xact_lock(169480002) AS locked',
    );
    locked = lock.locked;
    if (!locked) throw new ProviderDeferred('batch', 'busy', Date.now() + 5000);
    const scope = `${job.queueName}:${job.data.syncOnly || 'all'}`;
    let [run] = await runner.query(
      'SELECT * FROM cardano_sync_run WHERE scope=$1',
      [scope],
    );
    if (
      job.data.cardanoRunId &&
      run &&
      (run.id !== job.data.cardanoRunId || run.finished)
    ) {
      return {
        success: true,
        message: 'Continuation already completed or superseded',
      } as T;
    }
    if (!run || run.finished) {
      if (run)
        await runner.query('DELETE FROM cardano_sync_run WHERE scope=$1', [
          scope,
        ]);
      [run] = await runner.query(
        'INSERT INTO cardano_sync_run(scope,id,options) VALUES($1,$2,$3) RETURNING *',
        [
          scope,
          randomUUID(),
          JSON.stringify({
            forceRefresh: job.data.forceRefresh || false,
            syncOnly: job.data.syncOnly,
          }),
        ],
      );
    }
    await job.updateData({ ...job.data, ...run.options, cardanoRunId: run.id });
    // updateData does update Job.data; assign as well for test doubles/custom clients.
    job.data = { ...job.data, ...run.options, cardanoRunId: run.id };
    if (run.next_run_at && new Date(run.next_run_at).getTime() > Date.now())
      throw new ProviderDeferred(
        'batch',
        run.reason,
        new Date(run.next_run_at).getTime(),
      );
    const result = await local.run(
      {
        runner,
        id: run.id,
        started: new Date(run.started_at),
        dispatched: 0,
        chunkStarted: Date.now(),
      },
      work,
    );
    if ((result as { success?: boolean })?.success === false)
      throw new Error('Sync did not complete');
    await runner.query(
      'UPDATE cardano_sync_run SET finished=true,next_run_at=NULL,reason=NULL WHERE id=$1',
      [run.id],
    );
    await runner.query('DELETE FROM cardano_sync_stage WHERE run_id=$1', [
      run.id,
    ]);
    await runner.commitTransaction();
    locked = false;
    await job.updateProgress({ status: 'completed' });
    return result;
  } catch (e) {
    if (e instanceof ProviderDeferred) {
      if (locked && job.data.cardanoRunId)
        await runner.query(
          'UPDATE cardano_sync_run SET next_run_at=$2,reason=$3 WHERE id=$1 AND NOT finished',
          [job.data.cardanoRunId, new Date(e.retryAt), e.reason],
        );
      if (runner.isTransactionActive) await runner.commitTransaction();
      locked = false;
      return await delayBatch(job, token, e);
    }
    throw e;
  } finally {
    // Transaction-scoped locks also work with PgBouncer transaction pooling.
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    await runner.release();
  }
}
