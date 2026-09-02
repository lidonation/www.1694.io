import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeDepositLovelaceNullable1764661682000
  implements MigrationInterface
{
  name = 'MakeDepositLovelaceNullable1764661682000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make deposit_lovelace nullable in proposals table
    await queryRunner.query(
      `ALTER TABLE "proposals" ALTER COLUMN "deposit_lovelace" DROP NOT NULL`,
    );

    console.log('✅ Made deposit_lovelace nullable in proposals table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: This rollback assumes no null values exist
    await queryRunner.query(
      `ALTER TABLE "proposals" ALTER COLUMN "deposit_lovelace" SET NOT NULL`,
    );
  }
}
