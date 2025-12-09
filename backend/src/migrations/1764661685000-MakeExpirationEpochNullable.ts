import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeExpirationEpochNullable1764661685000 implements MigrationInterface {
  name = 'MakeExpirationEpochNullable1764661685000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make expiration_epoch nullable in proposals table
    await queryRunner.query(`ALTER TABLE "proposals" ALTER COLUMN "expiration_epoch" DROP NOT NULL`);
    
    console.log('✅ Made expiration_epoch nullable in proposals table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: This rollback assumes no null values exist
    await queryRunner.query(`ALTER TABLE "proposals" ALTER COLUMN "expiration_epoch" SET NOT NULL`);
  }
}