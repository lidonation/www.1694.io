import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOAuthEntity1747585984340 implements MigrationInterface {
    name = 'AddOAuthEntity1747585984340'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."oauth_provider_enum" AS ENUM('govtools')`);
        await queryRunner.query(`CREATE TABLE "oauth" ("deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "provider" "public"."oauth_provider_enum" NOT NULL, "accessToken" text NOT NULL, "refreshToken" text, "expiresAt" TIMESTAMP, "providerUserId" text, "stakeKeyBech32" text NOT NULL, "metadata" json, CONSTRAINT "PK_a957b894e50eb16b969c0640a8d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "oauth"`);
        await queryRunner.query(`DROP TYPE "public"."oauth_provider_enum"`);
    }

}
