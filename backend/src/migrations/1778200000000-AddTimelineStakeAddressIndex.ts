import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimelineStakeAddressIndex1778200000000 implements MigrationInterface {
  name = 'AddTimelineStakeAddressIndex1778200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Functional index on JSONB stake_address, scoped to delegation events only.
    // Used by TimelineWatcherWorker to look up the previous DRep for a stake address
    // when synthesizing undelegation events on re-delegation.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_drep_timeline_stake_delegation"
       ON "drep_timeline_event" ((metadata->>'stake_address'))
       WHERE event_type = 'delegation'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_drep_timeline_stake_delegation"`);
  }
}
