import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGovernanceIndexerTables1764661679000 implements MigrationInterface {
    name = 'AddGovernanceIndexerTables1764661679000'

    public async up(queryRunner: QueryRunner): Promise<void> {


        // Create unified drep_timeline_event table
        // Create unified drep_timeline_event table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS drep_timeline_event (
                id BIGSERIAL PRIMARY KEY,
                event_type TEXT NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL,
                epoch INTEGER NOT NULL,
                slot BIGINT NOT NULL,
                tx_hash TEXT NOT NULL,
                tx_index INTEGER NOT NULL,
                block_hash TEXT,
                drep_id TEXT,
                metadata JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
            )
        `);

        // Enforce uniqueness by transaction hash and index
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_drep_timeline_tx_event ON drep_timeline_event (tx_hash, tx_index)`);

        // Indexes for queries
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_timeline_type ON drep_timeline_event (event_type)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_timeline_timestamp ON drep_timeline_event (timestamp DESC)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_timeline_epoch ON drep_timeline_event (epoch)`);
        
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_drep_timeline_drep_id ON drep_timeline_event (drep_id)
            WHERE drep_id IS NOT NULL
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_drep_timeline_drep_timeline ON drep_timeline_event (drep_id, timestamp DESC)
            WHERE drep_id IS NOT NULL
        `);

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_timeline_metadata ON drep_timeline_event USING GIN (metadata)`);

        await queryRunner.query(`
            COMMENT ON COLUMN drep_timeline_event.metadata IS 'JSONB metadata structure by event_type:
            - registration: {drep_id, deposit, anchor_url, anchor_hash, tx_hash, epoch_no}
            - retirement: {drep_id, deposit, tx_hash}
            - delegation: {stake_address, target_drep, drep_has_script, previous_drep, tx_hash, total_stake, added_power}
            - proposal: {index, action_type, deposit, anchor_url, anchor_hash, reward_account, details}
            - vote: {voter_id, proposal_tx_hash, proposal_index, vote, anchor_url, anchor_hash, view, gov_action_proposal_id, time_voted, vote_rationale}'
        `);

        // Optimizing delegation lookups (added 2025-12-19)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_drep_timeline_stake_address 
            ON drep_timeline_event ((metadata->>'stake_address'), timestamp DESC) 
            WHERE event_type = 'delegation'
        `);


    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order (respecting foreign key constraints)
        await queryRunner.query(`DROP TABLE IF EXISTS drep_timeline_event`);
    }
}