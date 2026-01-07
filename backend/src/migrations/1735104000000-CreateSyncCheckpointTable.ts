import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSyncCheckpointTable1735104000000 implements MigrationInterface {
  name = 'CreateSyncCheckpointTable1735104000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Sync Checkpointing (added 2025-12-24)
      CREATE TABLE IF NOT EXISTS sync_checkpoint (
          worker_id TEXT PRIMARY KEY,
          last_slot BIGINT NOT NULL,
          last_hash TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Create index for performance on updated_at queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sync_checkpoint_updated_at 
      ON sync_checkpoint (updated_at);
    `);

    // Add comment to document the table purpose
    await queryRunner.query(`
      COMMENT ON TABLE sync_checkpoint IS 'Tracks sync progress for governance indexer workers';
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN sync_checkpoint.worker_id IS 'Unique identifier for the sync worker';
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN sync_checkpoint.last_slot IS 'Last processed slot number';
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN sync_checkpoint.last_hash IS 'Hash of the last processed block';
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN sync_checkpoint.updated_at IS 'Timestamp of last checkpoint update';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sync_checkpoint_updated_at;`);
    await queryRunner.query(`DROP TABLE IF EXISTS sync_checkpoint;`);
  }
}