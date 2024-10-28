import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1728984622640 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "notification" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "title" varchar NOT NULL,
            "message" varchar NOT NULL,
            "type" varchar NOT NULL DEFAULT 'info',
            "createdAt" timestamp NOT NULL DEFAULT now(),
            "isRead" boolean NOT NULL DEFAULT false,
            "isArchived" boolean NOT NULL DEFAULT false,
            "deletedAt" timestamp,
            "isPersistent" boolean NOT NULL DEFAULT false,
            "recipient" integer NOT NULL
        );
    `);
    await queryRunner.query(`
        ALTER TABLE "notification" 
        ADD CONSTRAINT "FK_signatureId" FOREIGN KEY ("recipient") REFERENCES "signature" ("id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "notification" 
        DROP CONSTRAINT "FK_signatureId";
    `);
    await queryRunner.query(`
        DROP TABLE "notification";
    `);
  }
}
