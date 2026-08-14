import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateDRepMetadataToJSON1764661687000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the new metadata column
    await queryRunner.query(`ALTER TABLE "dreps" ADD COLUMN "metadata" jsonb`);

    // Migration of data: Copy from individual columns to the new metadata JSON column
    // We'll construct a JSON object from existing columns if they are not all null
    await queryRunner.query(`
            UPDATE "dreps"
            SET "metadata" = jsonb_build_object(
                'url', "metadata_url",
                'hash', "metadata_hash",
                'json_metadata', jsonb_build_object(
                    'body', jsonb_build_object(
                        'givenName', "given_name",
                        'image', jsonb_build_object('contentUrl', "image_url"),
                        'paymentAddress', "payment_address",
                        'objectives', "objectives",
                        'motivations', "motivations",
                        'qualifications', "qualifications",
                        'references', "references"
                    )
                )
            )
            WHERE "given_name" IS NOT NULL 
               OR "image_url" IS NOT NULL 
               OR "payment_address" IS NOT NULL
               OR "objectives" IS NOT NULL
               OR "motivations" IS NOT NULL
               OR "qualifications" IS NOT NULL
               OR "references" IS NOT NULL
               OR "metadata_url" IS NOT NULL
               OR "metadata_hash" IS NOT NULL
        `);

    // Drop the old individual columns
    await queryRunner.query(`ALTER TABLE "dreps" DROP COLUMN "given_name"`);
    await queryRunner.query(`ALTER TABLE "dreps" DROP COLUMN "image_url"`);
    await queryRunner.query(
      `ALTER TABLE "dreps" DROP COLUMN "payment_address"`,
    );
    await queryRunner.query(`ALTER TABLE "dreps" DROP COLUMN "objectives"`);
    await queryRunner.query(`ALTER TABLE "dreps" DROP COLUMN "motivations"`);
    await queryRunner.query(`ALTER TABLE "dreps" DROP COLUMN "qualifications"`);
    await queryRunner.query(`ALTER TABLE "dreps" DROP COLUMN "references"`);
    await queryRunner.query(`ALTER TABLE "dreps" DROP COLUMN "metadata_url"`);
    await queryRunner.query(`ALTER TABLE "dreps" DROP COLUMN "metadata_hash"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back individual columns
    await queryRunner.query(`ALTER TABLE "dreps" ADD COLUMN "given_name" text`);
    await queryRunner.query(`ALTER TABLE "dreps" ADD COLUMN "image_url" text`);
    await queryRunner.query(
      `ALTER TABLE "dreps" ADD COLUMN "payment_address" text`,
    );
    await queryRunner.query(`ALTER TABLE "dreps" ADD COLUMN "objectives" text`);
    await queryRunner.query(
      `ALTER TABLE "dreps" ADD COLUMN "motivations" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "dreps" ADD COLUMN "qualifications" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "dreps" ADD COLUMN "references" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "dreps" ADD COLUMN "metadata_url" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "dreps" ADD COLUMN "metadata_hash" text`,
    );

    // Restore data from JSON if possible
    await queryRunner.query(`
            UPDATE "dreps"
            SET 
                "given_name" = "metadata"->'json_metadata'->'body'->>'givenName',
                "image_url" = "metadata"->'json_metadata'->'body'->'image'->>'contentUrl',
                "payment_address" = "metadata"->'json_metadata'->'body'->>'paymentAddress',
                "objectives" = "metadata"->'json_metadata'->'body'->>'objectives',
                "motivations" = "metadata"->'json_metadata'->'body'->>'motivations',
                "qualifications" = "metadata"->'json_metadata'->'body'->>'qualifications',
                "references" = "metadata"->'json_metadata'->'body'->'references',
                "metadata_url" = "metadata"->>'url',
                "metadata_hash" = "metadata"->>'hash'
            WHERE "metadata" IS NOT NULL
        `);

    // Drop metadata column
    await queryRunner.query(`ALTER TABLE "dreps" DROP COLUMN "metadata"`);
  }
}
