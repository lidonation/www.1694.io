import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeAmountLovelaceNullable1764661683000 implements MigrationInterface {
  name = 'MakeAmountLovelaceNullable1764661683000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make amount_lovelace nullable in dreps table
    await queryRunner.query(`ALTER TABLE "dreps" ALTER COLUMN "amount_lovelace" DROP NOT NULL`);
    
    console.log('✅ Made amount_lovelace nullable in dreps table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: This rollback assumes no null values exist
    await queryRunner.query(`ALTER TABLE "dreps" ALTER COLUMN "amount_lovelace" SET NOT NULL`);
  }
}