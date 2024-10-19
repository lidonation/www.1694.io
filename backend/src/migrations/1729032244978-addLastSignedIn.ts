import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastSignedIn1729032244978 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "signature"
            ADD COLUMN "lastSignedIn" timestamp NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "signature"
            DROP COLUMN "lastSignedIn";
        `);
    }

}
