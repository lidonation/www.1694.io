import { MigrationInterface, QueryRunner } from 'typeorm';

export class DenormalizeDrepTimelineEvent1735120000000 implements MigrationInterface {
  name = 'DenormalizeDrepTimelineEvent1735120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Denormalization migration (added 2025-12-25)
    // Purpose: Extract stake_address into its own column for blazing fast delegation lookups.

    await queryRunner.query(`
      ALTER TABLE drep_timeline_event ADD COLUMN IF NOT EXISTS stake_address TEXT;
    `);

    await queryRunner.query(`
      ALTER TABLE drep_timeline_event ADD COLUMN IF NOT EXISTS previous_drep TEXT;
    `);

    // Index for the lookup: "Who was this user delegated to before?"
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_drep_timeline_stake_lookup 
      ON drep_timeline_event (stake_address, timestamp DESC) 
      WHERE event_type = 'delegation';
    `);

    // Drop the old expensive JSONB functional index
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_drep_timeline_stake_address;
    `);

    // Add comments to document the new columns
    await queryRunner.query(`
      COMMENT ON COLUMN drep_timeline_event.stake_address IS 'Denormalized stake address for fast delegation lookups';
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN drep_timeline_event.previous_drep IS 'Previous DRep that the stake address was delegated to';
    `);

    // Optional: Populate the new columns from existing JSONB data if needed
    // Uncomment and modify the following queries based on your JSONB structure:
    
    // await queryRunner.query(`
    //   UPDATE drep_timeline_event 
    //   SET stake_address = event_data->>'stake_address'
    //   WHERE event_data ? 'stake_address' 
    //   AND stake_address IS NULL;
    // `);

    // await queryRunner.query(`
    //   UPDATE drep_timeline_event 
    //   SET previous_drep = event_data->>'previous_drep'
    //   WHERE event_data ? 'previous_drep' 
    //   AND previous_drep IS NULL;
    // `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the old JSONB functional index if it existed
    // Note: Uncomment and modify based on your original index structure
    // await queryRunner.query(`
    //   CREATE INDEX IF NOT EXISTS idx_drep_timeline_stake_address 
    //   ON drep_timeline_event USING GIN ((event_data->>'stake_address'));
    // `);

    // Drop the new index
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_drep_timeline_stake_lookup;
    `);

    // Drop the new columns
    await queryRunner.query(`
      ALTER TABLE drep_timeline_event DROP COLUMN IF EXISTS previous_drep;
    `);

    await queryRunner.query(`
      ALTER TABLE drep_timeline_event DROP COLUMN IF EXISTS stake_address;
    `);
  }
}