import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthorDrepFk1726926525946 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`
        ALTER TABLE note ADD CONSTRAINT fk_note_author FOREIGN KEY (author) REFERENCES signature(id);
        `);
        
        await queryRunner.query(`
        ALTER TABLE note ADD CONSTRAINT fk_note_drep FOREIGN KEY (drep) REFERENCES drep(id);
        `);
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        ALTER TABLE note DROP CONSTRAINT fk_note_author;
        `);
        
        await queryRunner.query(`
        ALTER TABLE note DROP CONSTRAINT fk_note_drep;
        `);
    }

}
