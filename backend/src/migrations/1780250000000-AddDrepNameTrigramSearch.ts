import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDrepNameTrigramSearch1780250000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    // pg_trgm is a trusted extension (PG13+), so the app role can create it.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    // GIN trigram index on the unwrapped CIP-119 givenName so fuzzy (similarity)
    // and ILIKE name search are index-accelerated. The expression must match the
    // query's expression exactly for the planner to use this index.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_dreps_given_name_trgm"
        ON "dreps"
        USING gin ((metadata->'json_metadata'->'body'->'givenName'->>'@value') gin_trgm_ops)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_dreps_given_name_trgm"`);
    // Leave the pg_trgm extension in place; other objects may depend on it.
  }
}
