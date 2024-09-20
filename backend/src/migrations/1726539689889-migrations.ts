import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1726539689889 implements MigrationInterface {
  name = 'Migrations1726539689889';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note" DROP CONSTRAINT "UQ_6841f094732260ba4e626f994c1"`,
    );
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "note_title"`);
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "note_content"`);
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "note_visibility"`);
    await queryRunner.query(
      `ALTER TABLE "note" ADD "title" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "UQ_c1872643429ea977256802b0974" UNIQUE ("title")`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD "content" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD "visibility" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "FK_59d5801d406020527940335d902" FOREIGN KEY ("authorId") REFERENCES "signature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note" DROP CONSTRAINT "FK_59d5801d406020527940335d902"`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" DROP CONSTRAINT "FK_270ca39118de4b28864f3de4d04"`,
    );
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "authorId"`);
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "drepId"`);
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "visibility"`);
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "content"`);
    await queryRunner.query(
      `ALTER TABLE "note" DROP CONSTRAINT "UQ_c1872643429ea977256802b0974"`,
    );
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "title"`);
    await queryRunner.query(
      `ALTER TABLE "signature" DROP COLUMN "signatureKey"`,
    );
    await queryRunner.query(`ALTER TABLE "signature" DROP COLUMN "signature"`);
    await queryRunner.query(`ALTER TABLE "signature" DROP COLUMN "stakeKey"`);
    await queryRunner.query(`ALTER TABLE "signature" DROP COLUMN "voterId"`);
    await queryRunner.query(`ALTER TABLE "note" ADD "voterId" integer`);
    await queryRunner.query(
      `ALTER TABLE "note" ADD "note_visibility" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD "note_content" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD "note_title" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "UQ_6841f094732260ba4e626f994c1" UNIQUE ("note_title")`,
    );
    await queryRunner.query(`ALTER TABLE "drep" ADD "social" json`);
    await queryRunner.query(
      `ALTER TABLE "drep" ADD "perspective" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "drep" ADD "expertise" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "drep" ADD "platform_statement" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "signature" ADD "drepSignatureKey" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "signature" ADD "drepSignature" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "signature" ADD "drepStakeKey" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "signature" ADD "drepVoterId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "FK_1039aaf9251b0cb14b7eec9140b" FOREIGN KEY ("voterId") REFERENCES "drep"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
