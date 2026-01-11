import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlockTimeToProposal1768059403563 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "proposals" ADD "block_time" TIMESTAMP WITH TIME ZONE`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "proposals" DROP COLUMN "block_time"`,
        );
    }

}
