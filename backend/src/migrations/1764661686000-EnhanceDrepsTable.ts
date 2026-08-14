import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceDrepsTable1764661686000 implements MigrationInterface {
  name = 'EnhanceDrepsTable1764661686000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to dreps table
    await queryRunner.query(`
      ALTER TABLE "dreps" 
      ADD COLUMN "active" boolean DEFAULT true,
      ADD COLUMN "active_epoch" integer,
      ADD COLUMN "metadata_url" text,
      ADD COLUMN "metadata_hash" text,
      ADD COLUMN "given_name" text,
      ADD COLUMN "image_url" text,
      ADD COLUMN "payment_address" text,
      ADD COLUMN "objectives" text,
      ADD COLUMN "motivations" text,
      ADD COLUMN "qualifications" text,
      ADD COLUMN "references" jsonb,
      ADD COLUMN "voting_power_ada" decimal(30,6),
      ADD COLUMN "delegation_vote_count" integer DEFAULT 0,
      ADD COLUMN "governance_vote_count" integer DEFAULT 0,
      ADD COLUMN "is_claimed" boolean DEFAULT false,
      ADD COLUMN "voltaire_drep_id" integer,
      ADD COLUMN "snapshot_epoch_no" integer
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "idx_drep_active" ON "dreps" ("active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_drep_voting_power" ON "dreps" ("voting_power_ada")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_drep_delegators" ON "dreps" ("delegation_vote_count")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_drep_claimed" ON "dreps" ("is_claimed")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "idx_drep_claimed"`);
    await queryRunner.query(`DROP INDEX "idx_drep_delegators"`);
    await queryRunner.query(`DROP INDEX "idx_drep_voting_power"`);
    await queryRunner.query(`DROP INDEX "idx_drep_active"`);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "dreps" 
      DROP COLUMN "snapshot_epoch_no",
      DROP COLUMN "voltaire_drep_id",
      DROP COLUMN "is_claimed",
      DROP COLUMN "governance_vote_count",
      DROP COLUMN "delegation_vote_count",
      DROP COLUMN "voting_power_ada",
      DROP COLUMN "references",
      DROP COLUMN "qualifications",
      DROP COLUMN "motivations",
      DROP COLUMN "objectives",
      DROP COLUMN "payment_address",
      DROP COLUMN "image_url",
      DROP COLUMN "given_name",
      DROP COLUMN "metadata_hash",
      DROP COLUMN "metadata_url",
      DROP COLUMN "active_epoch",
      DROP COLUMN "active"
    `);
  }
}
