import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncSchemaToModels1747169153430 implements MigrationInterface {
  name = 'SyncSchemaToModels1747169153430';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification" DROP CONSTRAINT "FK_signatureId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "synctime" DROP COLUMN "lastSyncTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "synctime" ADD "lastSyncTime" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "type"`);
    await queryRunner.query(
      `CREATE TYPE "public"."notification_type_enum" AS ENUM('info', 'warning', 'error')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ADD "type" "public"."notification_type_enum" NOT NULL DEFAULT 'info'`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP COLUMN "recipient"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ADD "recipient" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification" DROP COLUMN "recipient"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ADD "recipient" integer NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "notification" ADD "type" character varying NOT NULL DEFAULT 'info'`,
    );
    await queryRunner.query(
      `ALTER TABLE "synctime" DROP COLUMN "lastSyncTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "synctime" ADD "lastSyncTime" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ADD CONSTRAINT "FK_signatureId" FOREIGN KEY ("recipient") REFERENCES "signature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
