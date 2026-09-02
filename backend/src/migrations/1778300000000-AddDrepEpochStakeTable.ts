import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDrepEpochStakeTable1778300000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "drep_epoch_stake" (
        "id"              bigserial PRIMARY KEY,
        "drep_id"         text        NOT NULL,
        "epoch_no"        integer     NOT NULL,
        "amount_lovelace" bigint      NOT NULL,
        "active"          boolean     NOT NULL DEFAULT true,
        "snapshotted_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_drep_epoch_stake" UNIQUE ("drep_id", "epoch_no")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_drep_epoch_stake_epoch"  ON "drep_epoch_stake" ("epoch_no")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_drep_epoch_stake_active" ON "drep_epoch_stake" ("active")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_drep_epoch_stake_drep"   ON "drep_epoch_stake" ("drep_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "drep_epoch_stake"`);
  }
}
