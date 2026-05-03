import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSyncStateTable1777797605598 implements MigrationInterface {
    name = 'AddSyncStateTable1777797605598'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sync_state" ("key" character varying NOT NULL, "last_processed_id" bigint NOT NULL DEFAULT '0', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c1d9733c37275e3d785eb375ec2" PRIMARY KEY ("key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "sync_state"`);
    }

}
