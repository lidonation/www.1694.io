import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropDrepFrontendSnapshot1764661687000 implements MigrationInterface {
  name = 'DropDrepFrontendSnapshot1764661687000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_snapshot_view"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_snapshot_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_snapshot_retired"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_snapshot_is_claimed"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_snapshot_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_snapshot_voting_power"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_snapshot_live_stake"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_snapshot_delegators"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_snapshot_votes"`);
    
    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "drep_frontend_snapshot"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate table structure (simplified - you'd need the full schema if rollback is important)
    await queryRunner.query(`
      CREATE TABLE "drep_frontend_snapshot" (
        "drep_hash_id" bigint PRIMARY KEY,
        "view" text NOT NULL,
        "chain_id" text NOT NULL,
        "cip129_id" text NOT NULL,
        "has_script" boolean NOT NULL,
        "drep_type" text NOT NULL,
        "active" boolean NOT NULL,
        "retired" boolean NOT NULL,
        "is_registered_as_sole_voter" boolean NOT NULL DEFAULT false,
        "voting_power_ada" decimal(30,6) NOT NULL,
        "live_stake_ada" decimal(30,6),
        "delegation_vote_count" integer NOT NULL DEFAULT 0,
        "governance_vote_count" integer NOT NULL DEFAULT 0,
        "given_name" text,
        "image_url" text,
        "metadata_url" text,
        "stake_address" text,
        "reg_address" text,
        "is_claimed" boolean NOT NULL DEFAULT false,
        "voltaire_drep_id" integer,
        "snapshot_epoch_no" integer,
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Recreate indexes
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_drep_snapshot_view" ON "drep_frontend_snapshot" ("view")`);
    await queryRunner.query(`CREATE INDEX "idx_drep_snapshot_active" ON "drep_frontend_snapshot" ("active")`);
    await queryRunner.query(`CREATE INDEX "idx_drep_snapshot_retired" ON "drep_frontend_snapshot" ("retired")`);
    await queryRunner.query(`CREATE INDEX "idx_drep_snapshot_is_claimed" ON "drep_frontend_snapshot" ("is_claimed")`);
    await queryRunner.query(`CREATE INDEX "idx_drep_snapshot_type" ON "drep_frontend_snapshot" ("drep_type")`);
    await queryRunner.query(`CREATE INDEX "idx_drep_snapshot_voting_power" ON "drep_frontend_snapshot" ("voting_power_ada")`);
    await queryRunner.query(`CREATE INDEX "idx_drep_snapshot_live_stake" ON "drep_frontend_snapshot" ("live_stake_ada")`);
    await queryRunner.query(`CREATE INDEX "idx_drep_snapshot_delegators" ON "drep_frontend_snapshot" ("delegation_vote_count")`);
    await queryRunner.query(`CREATE INDEX "idx_drep_snapshot_votes" ON "drep_frontend_snapshot" ("governance_vote_count")`);
  }
}