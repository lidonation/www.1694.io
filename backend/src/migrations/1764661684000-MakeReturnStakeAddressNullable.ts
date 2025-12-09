import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeReturnStakeAddressNullable1764661684000 implements MigrationInterface {
  name = 'MakeReturnStakeAddressNullable1764661684000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make return_stake_address nullable in proposals table
    await queryRunner.query(`ALTER TABLE "proposals" ALTER COLUMN "return_stake_address" DROP NOT NULL`);
    
    console.log('✅ Made return_stake_address nullable in proposals table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: This rollback assumes no null values exist
    await queryRunner.query(`ALTER TABLE "proposals" ALTER COLUMN "return_stake_address" SET NOT NULL`);
  }
}