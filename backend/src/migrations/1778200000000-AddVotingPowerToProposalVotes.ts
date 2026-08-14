import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVotingPowerToProposalVotes1778200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "proposal_votes"
      ADD COLUMN IF NOT EXISTS "voting_power_lovelace" bigint NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_proposal_vote_voting_power"
      ON "proposal_votes" ("voting_power_lovelace")
      WHERE "voting_power_lovelace" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_proposal_vote_voting_power"`,
    );
    await queryRunner.query(
      `ALTER TABLE "proposal_votes" DROP COLUMN IF EXISTS "voting_power_lovelace"`,
    );
  }
}
