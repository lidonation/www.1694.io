import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteDuplicateSignatures1729366851137 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        //delete duplicate signatures where "drepId" is NULL
        await queryRunner.query(`
            DELETE FROM "signature" sig
            WHERE sig.id IN (
                SELECT s1.id
                FROM "signature" s1
                WHERE s1."stakeKey" IS NOT NULL
                AND EXISTS (
                    SELECT 1
                    FROM "signature" s2
                    WHERE s1."stakeKey" = s2."stakeKey"
                    AND (s1."drepId" IS NULL OR s1."drepId" = s2."drepId")
                    AND s1.id <> s2.id 
                    AND s2."drepId" IS NOT NULL
                )
                AND s1."drepId" IS NULL -- Specifically delete entries where "drepId" is NULL
            )
        `);
        //delete duplicate signatures where "drepId" is NOT NULL and is the same
        await queryRunner.query(`
            DELETE FROM "signature" sig
            WHERE sig.id IN (
                SELECT id FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (PARTITION BY "stakeKey", "drepId" ORDER BY id) AS row_num
                    FROM "signature"
                    WHERE "stakeKey" IS NOT NULL
                ) AS ranked
                WHERE ranked.row_num > 1
            );
          `);
          
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No need to rollback
    }

}
