import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOldGovernanceTables1764661681000 implements MigrationInterface {
  name = 'RemoveOldGovernanceTables1764661681000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old governance tables (CASCADE will handle foreign keys)
    await queryRunner.query(`DROP TABLE IF EXISTS "governance_vote" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "governance_action" CASCADE`);
    
    console.log('✅ Removed old governance tables: governance_action, governance_vote');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: We won't recreate these tables in the down migration since we're replacing them
    // If rollback is needed, restore from backup
    console.log('⚠️  Cannot recreate old governance tables - restore from backup if needed');
  }
}