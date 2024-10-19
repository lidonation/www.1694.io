import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncTime1729359985813 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
             CREATE TABLE "synctime" (
            "id" SERIAL NOT NULL PRIMARY KEY,
             "lastSyncTime" timestamp NOT NULL DEFAULT now()
        )
            `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "synctime"
        `);
    }

}
