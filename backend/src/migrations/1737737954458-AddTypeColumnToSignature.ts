import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeColumnToSignature1737737954458
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "signature" ADD "type" character varying`,
    );

    await queryRunner.query(
      `ALTER TABLE "signature" ADD "drep_bech32" character varying`,
    );

    // Copy data from voterId to drep_bech32
    await queryRunner.query(`UPDATE "signature" SET "drep_bech32" = "voterId"`);

    // set type to 'drep' for all existing rows
    await queryRunner.query(`UPDATE "signature" SET "type" = 'drep'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "signature" DROP COLUMN "type"`);

    await queryRunner.query(
      `ALTER TABLE "signature" DROP COLUMN "drep_bech32"`,
    );
  }
}
