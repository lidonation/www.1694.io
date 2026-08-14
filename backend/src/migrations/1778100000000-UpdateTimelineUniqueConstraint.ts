import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTimelineUniqueConstraint1778100000000
  implements MigrationInterface
{
  name = 'UpdateTimelineUniqueConstraint1778100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old index created by the indexer
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uniq_drep_timeline_tx_event"`,
    );

    // Create the new unique index that includes event_type
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uniq_drep_timeline_tx_event_type" ON "drep_timeline_event" ("tx_hash", "tx_index", "event_type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the new index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uniq_drep_timeline_tx_event_type"`,
    );

    // Re-create the old index
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uniq_drep_timeline_tx_event" ON "drep_timeline_event" ("tx_hash", "tx_index")`,
    );
  }
}
