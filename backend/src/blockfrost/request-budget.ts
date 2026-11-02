import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export type DeferralReason =
  | 'quota'
  | 'throttle'
  | 'authentication'
  | 'transient'
  | 'budget'
  | 'configuration'
  | 'busy';
export class ProviderDeferred extends HttpException {
  constructor(
    readonly scope: string,
    readonly reason: DeferralReason,
    readonly retryAt: number,
    status = 503,
  ) {
    super(
      { message: `Cardano request deferred: ${reason}`, reason, retryAt },
      status,
    );
  }
}
export function retryAfter(value: unknown, now: number): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const text = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(text)) {
    const at = now + Number(text) * 1000;
    return Number.isSafeInteger(Math.ceil(at)) ? Math.ceil(at) : undefined;
  }
  if (!/[a-z]/i.test(text)) return undefined;
  const at = Date.parse(text);
  return Number.isFinite(at) && at > now ? at : undefined;
}

// Kept identical in both independently-built Nest packages; parity is regression-tested.
@Injectable()
export class RequestBudget {
  private readonly logger = new Logger(RequestBudget.name);
  private readonly daily: number;
  private readonly batch: number;
  private readonly resetHour: number;
  constructor(
    private readonly config: ConfigService,
    @InjectDataSource('default') private readonly db: DataSource,
  ) {
    this.daily = this.integer('CARDANO_DAILY_LIMIT', 0, 80000);
    this.batch = this.integer('CARDANO_BATCH_DAILY_LIMIT', 0, this.daily);
    this.resetHour = this.integer('CARDANO_QUOTA_RESET_UTC_HOUR', 0, 23);
    if (this.daily && this.config.get('CARDANO_QUOTA_RESET_UTC_HOUR') == null)
      throw new Error(
        'CARDANO_QUOTA_RESET_UTC_HOUR must be explicit when enabling requests',
      );
  }
  private integer(key: string, fallback: number, max: number): number {
    const raw = String(this.config.get(key) ?? fallback);
    if (!/^\d+$/.test(raw) || Number(raw) > max)
      throw new Error(`Invalid ${key}`);
    return Number(raw);
  }
  scope(route: 'primary' | 'fallback' | 'ipfs', projectId: string): string {
    const scope =
      this.config.get<string>(`CARDANO_QUOTA_${route.toUpperCase()}_SCOPE`) ||
      'shared';
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(scope))
      throw new Error('Invalid Cardano quota scope');
    // A single credential cannot become independent just by giving it two names.
    const primary =
      this.config.get<string>('CARDANO_API_PROJECT_ID')?.trim() ||
      this.config.get<string>('BLOCKFROST_NETWORK_PROJECT_ID');
    if (route !== 'primary' && projectId && projectId === primary)
      return this.scope('primary', primary);
    const fallback = this.config.get<string>(
      'BLOCKFROST_NETWORK_PROJECT_ID_FALLBACK',
    );
    if (route === 'ipfs' && projectId && projectId === fallback)
      return this.scope('fallback', fallback);
    return scope;
  }
  async acquire(scope: string, batch: boolean): Promise<void> {
    if (!this.daily || (batch && !this.batch))
      throw new ProviderDeferred(scope, 'configuration', Date.now() + 3600000);
    try {
      await this.db.transaction(async (manager) => {
        for (const bucket of ['@application', scope]) {
          await manager.query(
            `INSERT INTO cardano_request_budget(scope) VALUES ($1) ON CONFLICT DO NOTHING`,
            [bucket],
          );
          const [row] = await manager.query(
            `SELECT *, clock_timestamp() AS now,
          (date_trunc('day', clock_timestamp() AT TIME ZONE 'UTC' - $2 * interval '1 hour') + $2 * interval '1 hour') AT TIME ZONE 'UTC' AS period
          FROM cardano_request_budget WHERE scope=$1 FOR UPDATE`,
            [bucket, this.resetHour],
          );
          const now = new Date(row.now).getTime(),
            period = new Date(row.period).getTime();
          if (row.reset_hour != null && row.reset_hour !== this.resetHour)
            throw new ProviderDeferred(scope, 'configuration', now + 3600000);
          const fresh = new Date(row.period_start).getTime() < period;
          const used = fresh ? 0 : row.used,
            batchUsed = fresh ? 0 : row.batch_used;
          const cap = fresh ? this.daily : Math.min(this.daily, row.cap);
          const batchCap = fresh
            ? this.batch
            : Math.min(this.batch, row.batch_cap);
          if (new Date(row.blocked_until).getTime() > now)
            throw new ProviderDeferred(
              scope,
              row.reason,
              new Date(row.blocked_until).getTime(),
            );
          if (used >= cap || (batch && batchUsed >= batchCap))
            throw new ProviderDeferred(scope, 'budget', period + 86400000);
          await manager.query(
            `UPDATE cardano_request_budget SET period_start=$2, used=$3, batch_used=$4, cap=$5, batch_cap=$6, reset_hour=$7 WHERE scope=$1`,
            [
              bucket,
              new Date(period),
              used + 1,
              batchUsed + (batch ? 1 : 0),
              cap,
              batchCap,
              this.resetHour,
            ],
          );
        }
      });
    } catch (e) {
      if (e instanceof ProviderDeferred) throw e;
      throw new ProviderDeferred(scope, 'configuration', Date.now() + 60000);
    }
  }
  async failure(scope: string, error: any): Promise<Error> {
    const status = error?.response?.status || error?.status || 503;
    if (status === 404)
      return new HttpException('Cardano record not found', 404);
    if (
      status >= 400 &&
      status < 500 &&
      ![401, 402, 403, 418, 429].includes(status)
    )
      return new HttpException('Cardano request rejected', status);
    const reason: DeferralReason =
      status === 402
        ? 'quota'
        : status === 429
          ? 'throttle'
          : [401, 403, 418].includes(status)
            ? 'authentication'
            : 'transient';
    const delay =
      reason === 'quota'
        ? 86400000
        : reason === 'authentication'
          ? 3600000
          : 60000;
    const at = Math.max(
      Date.now() + delay,
      retryAfter(error?.response?.headers?.['retry-after'], Date.now()) || 0,
    );
    try {
      const changed = await this.db.query(
        `UPDATE cardano_request_budget SET blocked_until=GREATEST(blocked_until,$2), reason=$3 WHERE scope=$1 AND blocked_until < $2 RETURNING scope`,
        [scope, new Date(at), reason],
      );
      if (changed.length)
        this.logger.warn(`Cardano provider deferred reason=${reason}`);
    } catch {
      return new ProviderDeferred(scope, 'configuration', Date.now() + 60000);
    }
    return new ProviderDeferred(scope, reason, at, status);
  }
}
