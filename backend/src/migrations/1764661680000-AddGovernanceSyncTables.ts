import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGovernanceSyncTables1764661680000
  implements MigrationInterface
{
  name = 'AddGovernanceSyncTables1764661680000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create dreps table
    await queryRunner.query(`
      CREATE TABLE "dreps" (
        "drep_id" text NOT NULL,
        "hex" text NOT NULL,
        "amount_lovelace" bigint NOT NULL,
        "has_script" boolean NOT NULL,
        "retired" boolean NOT NULL,
        "expired" boolean NOT NULL,
        "last_active_epoch" integer,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dreps_drep_id" PRIMARY KEY ("drep_id")
      )
    `);

    // Create indexes for dreps
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_drep_id" ON "dreps" ("drep_id")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_drep_hex" ON "dreps" ("hex")`);
    await queryRunner.query(
      `CREATE INDEX "idx_drep_retired" ON "dreps" ("retired")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_drep_expired" ON "dreps" ("expired")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_drep_active_epoch" ON "dreps" ("last_active_epoch")`,
    );

    // Create drep_delegators table
    await queryRunner.query(`
      CREATE TABLE "drep_delegators" (
        "drep_id" text NOT NULL,
        "stake_address" text NOT NULL,
        "amount_lovelace" bigint NOT NULL,
        "voting_power_lovelace" bigint,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_drep_delegators" PRIMARY KEY ("drep_id", "stake_address")
      )
    `);

    // Create indexes for drep_delegators
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_drep_delegator_composite" ON "drep_delegators" ("drep_id", "stake_address")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_drep_delegator_drep" ON "drep_delegators" ("drep_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_drep_delegator_stake" ON "drep_delegators" ("stake_address")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_drep_delegator_amount" ON "drep_delegators" ("amount_lovelace")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_drep_delegator_voting_power" ON "drep_delegators" ("voting_power_lovelace")`,
    );

    // Create proposals table
    await queryRunner.query(`
      CREATE TABLE "proposals" (
        "id" text NOT NULL,
        "tx_hash" text NOT NULL,
        "cert_index" integer NOT NULL,
        "governance_type" text NOT NULL,
        "governance_description" jsonb,
        "deposit_lovelace" bigint NOT NULL,
        "return_stake_address" text NOT NULL,
        "ratified_epoch" integer,
        "enacted_epoch" integer,
        "dropped_epoch" integer,
        "expired_epoch" integer,
        "expiration_epoch" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_proposals_id" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for proposals
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_proposal_id" ON "proposals" ("id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_proposal_tx" ON "proposals" ("tx_hash", "cert_index")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_proposal_type" ON "proposals" ("governance_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_proposal_ratified" ON "proposals" ("ratified_epoch")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_proposal_enacted" ON "proposals" ("enacted_epoch")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_proposal_dropped" ON "proposals" ("dropped_epoch")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_proposal_expired" ON "proposals" ("expired_epoch")`,
    );

    // Create proposal_metadata table
    await queryRunner.query(`
      CREATE TABLE "proposal_metadata" (
        "proposal_id" text NOT NULL,
        "url" text,
        "hash" text,
        "json_metadata" jsonb,
        "bytes" text,
        "version" text NOT NULL,
        "error" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_proposal_metadata_proposal_id" PRIMARY KEY ("proposal_id")
      )
    `);

    // Create indexes for proposal_metadata
    await queryRunner.query(
      `CREATE INDEX "idx_proposal_metadata_proposal" ON "proposal_metadata" ("proposal_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_proposal_metadata_url" ON "proposal_metadata" ("url")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_proposal_metadata_version" ON "proposal_metadata" ("version")`,
    );

    // Create proposal_votes table
    await queryRunner.query(`
      CREATE TABLE "proposal_votes" (
        "id" bigserial NOT NULL,
        "proposal_id" text NOT NULL,
        "tx_hash" text NOT NULL,
        "cert_index" integer NOT NULL,
        "voter_role" text NOT NULL,
        "voter" text NOT NULL,
        "vote" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_proposal_votes_id" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for proposal_votes
    await queryRunner.query(
      `CREATE INDEX "idx_proposal_vote_proposal" ON "proposal_votes" ("proposal_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_proposal_vote_voter" ON "proposal_votes" ("voter")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_proposal_vote_role" ON "proposal_votes" ("voter_role")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_proposal_vote_composite" ON "proposal_votes" ("proposal_id", "voter")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_proposal_vote_tx" ON "proposal_votes" ("tx_hash", "cert_index")`,
    );

    // Note: drep_timeline_event now uses unified schema with metadata JSONB column
    // No additional columns needed as all event data is stored in metadata

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "drep_delegators" 
      ADD CONSTRAINT "FK_drep_delegators_drep_id" 
      FOREIGN KEY ("drep_id") REFERENCES "dreps"("drep_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "proposal_metadata" 
      ADD CONSTRAINT "FK_proposal_metadata_proposal_id" 
      FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "proposal_votes" 
      ADD CONSTRAINT "FK_proposal_votes_proposal_id" 
      FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE
    `);

    // Note: drep_timeline_event uses unified schema - no FK constraints needed
    // Event relationships are managed through metadata JSONB and drep_id column
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraints first
    await queryRunner.query(
      `ALTER TABLE "proposal_votes" DROP CONSTRAINT IF EXISTS "FK_proposal_votes_proposal_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "proposal_metadata" DROP CONSTRAINT IF EXISTS "FK_proposal_metadata_proposal_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "drep_delegators" DROP CONSTRAINT IF EXISTS "FK_drep_delegators_drep_id"`,
    );

    // Note: drep_timeline_event uses unified schema - no additional columns to drop

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "proposal_votes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "proposal_metadata"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "proposals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "drep_delegators"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dreps"`);
  }
}
