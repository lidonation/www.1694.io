import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Queues, YaciDRepSyncJobData, YaciDRepSyncJobResponse } from '../queue.types';
import { LOCK_DURATION_MEDIUM } from '../queue.constants';
import { YaciStoreService } from '../yaci/yaci-store.service';
import { drepHashToBech32 } from '../yaci/bech32.util';

const CHUNK_SIZE = 500;

@Injectable()
@Processor(Queues.YACI_DREP_SYNC, { lockDuration: LOCK_DURATION_MEDIUM })
export class YaciDRepSyncWorker extends WorkerHost {
  private readonly logger = new Logger(YaciDRepSyncWorker.name);

  constructor(
    private readonly yaciStore: YaciStoreService,
    @InjectDataSource('default')
    private readonly db: DataSource,
  ) {
    super();
  }

  async process(job: Job<YaciDRepSyncJobData, YaciDRepSyncJobResponse>): Promise<YaciDRepSyncJobResponse> {
    this.logger.log(`Starting Yaci DRep sync: ${job.id}`);

    const registrations = await this.yaciStore.getAllDRepRegistrations();
    if (registrations.length === 0) {
      return { success: true, message: 'No DRep registrations found', upserted: 0 };
    }

    let upserted = 0;
    for (let i = 0; i < registrations.length; i += CHUNK_SIZE) {
      const chunk = registrations.slice(i, i + CHUNK_SIZE);
      await this.db.query(
        `INSERT INTO dreps (drep_id, hex, active, retired, has_script, active_epoch, created_at, updated_at)
         SELECT * FROM UNNEST($1::text[], $2::text[], $3::bool[], $4::bool[], $5::bool[], $6::int[], $7::timestamptz[], $8::timestamptz[])
         ON CONFLICT (drep_id) DO UPDATE SET
           active       = EXCLUDED.active,
           retired      = EXCLUDED.retired,
           has_script   = EXCLUDED.has_script,
           active_epoch = EXCLUDED.active_epoch,
           updated_at   = EXCLUDED.updated_at`,
        [
          chunk.map(r => drepHashToBech32(r.drep_hash, r.drep_type)),
          chunk.map(r => r.drep_hash),
          chunk.map(r => r.action_type !== 'UNREGISTER'),
          chunk.map(r => r.action_type === 'UNREGISTER'),
          chunk.map(r => r.drep_type === 'SCRIPTHASH'),
          chunk.map(r => r.epoch),
          chunk.map(() => new Date()),
          chunk.map(() => new Date()),
        ],
      );
      upserted += chunk.length;
    }

    this.logger.log(`DRep sync complete: ${upserted} upserted`);
    return { success: true, message: `Upserted ${upserted} DReps`, upserted };
  }
}
