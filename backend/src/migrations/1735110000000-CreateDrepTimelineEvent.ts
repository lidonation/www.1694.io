import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDrepTimelineEvent1735110000000 implements MigrationInterface {
  name = 'CreateDrepTimelineEvent1735110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "drep_timeline_event" (
        "id" BIGSERIAL NOT NULL, 
        "event_type" text NOT NULL, 
        "timestamp" TIMESTAMPTZ NOT NULL, 
        "epoch" integer NOT NULL, 
        "slot" bigint NOT NULL, 
        "tx_hash" text NOT NULL, 
        "tx_index" integer NOT NULL,
        "block_hash" text, 
        "drep_id" text, 
        "metadata" jsonb NOT NULL, 
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), 
        CONSTRAINT "PK_drep_timeline_event_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uniq_drep_timeline_tx_event" ON "drep_timeline_event" ("tx_hash", "tx_index")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_drep_timeline_type" ON "drep_timeline_event" ("event_type")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_drep_timeline_timestamp" ON "drep_timeline_event" ("timestamp" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_drep_timeline_epoch" ON "drep_timeline_event" ("epoch")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_drep_timeline_tx_hash" ON "drep_timeline_event" ("tx_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_drep_timeline_drep_id" ON "drep_timeline_event" ("drep_id") 
      WHERE drep_id IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_drep_timeline_drep_timeline" ON "drep_timeline_event" ("drep_id", "timestamp" DESC) 
      WHERE drep_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_timeline_drep_timeline"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_timeline_drep_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_timeline_tx_hash"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_timeline_epoch"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_timeline_timestamp"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_timeline_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "drep_timeline_event"`);
  }
}
