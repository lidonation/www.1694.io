import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBlockTimeToProposalVote1764661688000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'proposal_votes',
      new TableColumn({
        name: 'block_time',
        type: 'timestamptz',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('proposal_votes', 'block_time');
  }
}
