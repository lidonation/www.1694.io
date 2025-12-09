import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGovernanceIndexerTables1764661679000 implements MigrationInterface {
    name = 'AddGovernanceIndexerTables1764661679000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create drep_frontend_snapshot table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS drep_frontend_snapshot (
                -- Identity
                drep_hash_id           BIGINT PRIMARY KEY,   -- matches on-chain drep_hash.id
                view                   TEXT    NOT NULL,     -- CIP-105 style DRep view used by the app
                chain_id               TEXT    NOT NULL,     -- hex-encoded credential (e.g. encode(raw,'hex'))
                cip129_id              TEXT    NOT NULL,     -- precomputed CIP-129 bech32 identifier
                has_script             BOOLEAN NOT NULL,

                -- Classification / status
                drep_type              TEXT    NOT NULL,     -- 'drep' | 'scripted' | 'voting_option'
                active                 BOOLEAN NOT NULL,     -- on-chain active vs inactive
                retired                BOOLEAN NOT NULL,     -- retired flag from registration/deposit
                is_registered_as_sole_voter BOOLEAN NOT NULL DEFAULT FALSE,

                -- Aggregated stake / power (already converted to ADA, not lovelace)
                voting_power_ada       NUMERIC(30,6) NOT NULL,  -- current voting power
                live_stake_ada         NUMERIC(30,6),           -- current live stake (nullable)
                delegation_vote_count  INTEGER NOT NULL DEFAULT 0,  -- number of delegators
                governance_vote_count  INTEGER NOT NULL DEFAULT 0,  -- number of distinct gov actions voted on

                -- Display metadata (from off-chain vote data / anchors)
                given_name             TEXT,
                image_url              TEXT,
                metadata_url           TEXT,
                stake_address          TEXT,                -- most-relevant stake address for this DRep
                reg_address            TEXT,                -- registration address from tx_out

                -- Voltaire integration / campaign state
                is_claimed             BOOLEAN NOT NULL DEFAULT FALSE,  -- has at least one signature in Voltaire DB
                voltaire_drep_id       INTEGER,                           -- local Drep.id if applicable

                -- Bookkeeping
                snapshot_epoch_no      INTEGER,              -- epoch used to compute the snapshot (optional)
                updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `);

        // Create indexes for drep_frontend_snapshot
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_drep_snapshot_view ON drep_frontend_snapshot(view)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_snapshot_active ON drep_frontend_snapshot(active)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_snapshot_retired ON drep_frontend_snapshot(retired)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_snapshot_is_claimed ON drep_frontend_snapshot(is_claimed)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_snapshot_type ON drep_frontend_snapshot(drep_type)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_snapshot_voting_power ON drep_frontend_snapshot(voting_power_ada DESC)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_snapshot_live_stake ON drep_frontend_snapshot(live_stake_ada DESC)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_snapshot_delegators ON drep_frontend_snapshot(delegation_vote_count DESC)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_snapshot_votes ON drep_frontend_snapshot(governance_vote_count DESC)`);

        // Create unified drep_timeline_event table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS drep_timeline_event (
                id BIGSERIAL PRIMARY KEY,
                
                -- Event classification
                event_type TEXT NOT NULL, -- 'registration', 'retirement', 'delegation', 'proposal', 'vote'
                
                -- Temporal data
                timestamp TIMESTAMPTZ NOT NULL,
                epoch INTEGER NOT NULL,
                slot BIGINT NOT NULL,
                
                -- Transaction context
                tx_hash TEXT NOT NULL,
                block_hash TEXT, -- Optional: for deeper chain tracking
                
                -- DRep identifier (nullable for non-DRep events like proposals)
                drep_id TEXT,
                
                -- Flexible metadata storage - structure varies by event_type
                -- See schema documentation for detailed structure by event_type
                metadata JSONB NOT NULL,
                
                -- Bookkeeping
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `);

        // Create indexes for drep_timeline_event
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_timeline_type ON drep_timeline_event(event_type)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_timeline_timestamp ON drep_timeline_event(timestamp DESC)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_timeline_epoch ON drep_timeline_event(epoch)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_timeline_tx_hash ON drep_timeline_event(tx_hash)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_timeline_drep_id ON drep_timeline_event(drep_id) WHERE drep_id IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_timeline_drep_timeline ON drep_timeline_event(drep_id, timestamp DESC) WHERE drep_id IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drep_timeline_metadata ON drep_timeline_event USING GIN (metadata)`);

        // Create governance_action table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS governance_action (
                id BIGSERIAL PRIMARY KEY,
                
                -- Action identifier
                tx_hash TEXT NOT NULL,
                action_index INTEGER NOT NULL,
                action_id TEXT NOT NULL UNIQUE, -- Computed: tx_hash#action_index
                
                -- Proposal details
                action_type TEXT NOT NULL, -- infoAction, parameterChange, hardForkInitiation, etc.
                action_details JSONB,
                
                -- Proposer info
                deposit_lovelace BIGINT NOT NULL,
                return_address TEXT, -- Stake address to return deposit
                
                -- Metadata
                metadata_url TEXT,
                metadata_hash TEXT,
                title TEXT,
                abstract TEXT,
                
                -- Lifecycle
                proposal_tx_hash TEXT NOT NULL,
                proposal_slot BIGINT NOT NULL,
                proposal_epoch INTEGER NOT NULL,
                proposal_timestamp TIMESTAMPTZ NOT NULL,
                
                expiration_epoch INTEGER,
                enacted_epoch INTEGER,
                dropped_epoch INTEGER,
                expired_epoch INTEGER,
                
                status TEXT NOT NULL DEFAULT 'proposed', -- proposed, enacted, dropped, expired
                
                -- Voting tallies (updated as votes come in)
                drep_yes_votes INTEGER NOT NULL DEFAULT 0,
                drep_no_votes INTEGER NOT NULL DEFAULT 0,
                drep_abstain_votes INTEGER NOT NULL DEFAULT 0,
                
                cc_yes_votes INTEGER NOT NULL DEFAULT 0,
                cc_no_votes INTEGER NOT NULL DEFAULT 0,
                cc_abstain_votes INTEGER NOT NULL DEFAULT 0,
                
                spo_yes_votes INTEGER NOT NULL DEFAULT 0,
                spo_no_votes INTEGER NOT NULL DEFAULT 0,
                spo_abstain_votes INTEGER NOT NULL DEFAULT 0,
                
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `);

        // Create indexes for governance_action
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_gov_action_action_id ON governance_action(action_id)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_gov_action_tx_hash ON governance_action(tx_hash)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_gov_action_type ON governance_action(action_type)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_gov_action_status ON governance_action(status)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_gov_action_proposal_epoch ON governance_action(proposal_epoch)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_gov_action_expiration ON governance_action(expiration_epoch)`);

        // Create governance_vote table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS governance_vote (
                id BIGSERIAL PRIMARY KEY,
                
                -- Action being voted on
                action_id TEXT NOT NULL REFERENCES governance_action(action_id),
                
                -- Voter identity
                voter_type TEXT NOT NULL, -- drep, cc (constitutional committee), spo (stake pool)
                voter_credential TEXT NOT NULL, -- drep1... or stake pool bech32
                voter_has_script BOOLEAN NOT NULL DEFAULT FALSE,
                
                -- Vote details  
                vote TEXT NOT NULL, -- yes, no, abstain
                
                -- Vote rationale
                rationale_url TEXT,
                rationale_hash TEXT,
                rationale_text TEXT, -- Fetched from URL
                
                -- When voted
                vote_tx_hash TEXT NOT NULL,
                vote_slot BIGINT NOT NULL,
                vote_epoch INTEGER NOT NULL,
                vote_timestamp TIMESTAMPTZ NOT NULL,
                
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                
                -- Ensure one vote per voter per action
                UNIQUE(action_id, voter_credential)
            )
        `);

        // Create indexes for governance_vote
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_gov_vote_action_id ON governance_vote(action_id)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_gov_vote_voter ON governance_vote(voter_credential)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_gov_vote_voter_type ON governance_vote(voter_type)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_gov_vote_vote ON governance_vote(vote)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_gov_vote_epoch ON governance_vote(vote_epoch)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order (respecting foreign key constraints)
        await queryRunner.query(`DROP TABLE IF EXISTS governance_vote`);
        await queryRunner.query(`DROP TABLE IF EXISTS governance_action`);
        await queryRunner.query(`DROP TABLE IF EXISTS drep_timeline_event`);
        await queryRunner.query(`DROP TABLE IF EXISTS drep_frontend_snapshot`);
    }
}