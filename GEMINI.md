# Gemini Guidelines - Project 1694

## Project Overview
Project 1694 is the **Voltaire DRep Campaign Platform**, a specialized explorer and management tool for Cardano's CIP-1694 governance era. It enables Decentralized Representatives (DReps) to manage profiles, track on-chain/off-chain activities, and communicate with delegators.

## Technical Stack
- **Backend API**: NestJS (located in `/backend`)
- **Indexing & Workers**: NestJS + BullMQ (located in `/queue-backend`)
- **Frontend**: Next.js (located in `/frontend`)
- **Data Source**: Blockfrost API & Yaci Store
- **Infrastructure**: Docker & Kubernetes (Helm)

## Required AI Skills & Knowledge
- **Cardano Governance**: Deep understanding of CIP-1694, DReps, Constitutional Committee, and Governance Actions.
- **NestJS & BullMQ**: Proficiency in building scalable APIs and resilient background processing pipelines.
- **Blockchain Syncing Patterns**: Experience with delta-syncing, rate-limiting, and resilient data ingestion.
- **TypeORM**: Advanced query optimization and schema management for high-volume data.

## Operational Commands
- **Check Status**: `make status`
- **View Logs**: `make logs-backend`, `make logs-queue`, `make logs-frontend`
- **Trigger Syncs**:
  - All: `make sync-all`
  - Proposals: `make sync-proposals`
  - Governance: `make sync-governance`
  - Votes: `make sync-drep-votes`
  - Stake: `make sync-stake`
- **Database Stats**: `make db-stats`
- **Migrations**: `make migrate`, `make generate-migration MIGRATION_NAME=Name`

## Technical Observations
- **Data Sourcing**: Use `BlockfrostService` for external data. Query the database before API calls to implement delta-sync.
- **Rate Limiting**: Essential for Blockfrost API. Use `setTimeout` and check for 429 status codes.
- **Multitenancy**: Be aware of the `dbsync_db` vs `voltaire_db` distinction.
- **Resiliency**: Store transient errors in the database (e.g., `error` field in metadata) to prevent infinite retry loops.

## Code Standards & AI Behavior

### 1. Minimal Logging
- Only log essential lifecycle events (Job Start/End).
- Avoid logging individual items in a loop unless it's a critical error.
- Use `debug` level for detailed information that isn't needed in production.
- No "Syncing item X..." or "Processing page Y..." logs in standard production runs.

### 2. Professional Comments
- Remove redundant comments that explain *what* the code does (the code should be self-documenting).
- Only use comments to explain *why* a complex decision was made.
- Avoid large block comments or "Phase X" headers unless the logic is exceptionally complex.
- No "Rate limiting..." or "Fetch Phase" comments.

### 3. Clean Code
- Use descriptive variable and function names.
- Keep functions small and focused.
- Remove dead code and unused imports immediately.

### 4. Error Handling
- Catch errors at the appropriate level.
- Log errors concisely. Avoid large error objects in logs if a message suffices.
