import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDrepDelegatorEpochStake1778400000000 implements MigrationInterface {
  name = 'AddDrepDelegatorEpochStake1778400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS drep_delegator_epoch_stake (
        drep_id         TEXT    NOT NULL,
        stake_address   TEXT    NOT NULL,
        epoch_no        INTEGER NOT NULL,
        amount_lovelace BIGINT  NOT NULL DEFAULT 0,
        PRIMARY KEY (drep_id, stake_address, epoch_no)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_drep_delegator_epoch_drep_epoch
        ON drep_delegator_epoch_stake (drep_id, epoch_no)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_drep_delegator_epoch_stake_epoch
        ON drep_delegator_epoch_stake (stake_address, epoch_no)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS drep_delegator_epoch_stake`);
  }
}
