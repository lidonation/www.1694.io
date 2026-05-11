# Claude Guidelines - Project 1694

## Project Overview
Project 1694 is the **Voltaire DRep Campaign Platform**, an ecosystem for Cardano's CIP-1694 governance. It serves as a portal for Decentralized Representatives (DReps) and delegators to interact with the on-chain governance process.

## Technical Stack
- **API**: NestJS (located in `/backend`)
- **Indexing**: NestJS + BullMQ (located in `/queue-backend`)
- **Frontend**: Next.js (located in `/frontend`)
- **Chain Data**: Blockfrost API & Yaci Store
- **Ops**: Docker & Kubernetes (Helm)

## Required AI Skills
- **Cardano SDKs**: Experience with Mesh, Lucid, or other Cardano development tools.
- **Background Processing**: Mastery of BullMQ and worker-based architectures.
- **PostgreSQL & JSONB**: Efficient handling of blockchain metadata and large-scale indexing.
- **Resilient Architectures**: Designing for network failures, rate-limits, and data integrity.

## Operational Shortcuts
- **Indexing**: `make sync-all` (incremental), `make sync-all-force` (full refresh).
- **Diagnostics**: `make logs-queue` for worker status, `make db-stats` for record counts.
- **Maintenance**: `make clean-db-and-sync` to reset governance data and re-index.

## Key Observations
- **Backend vs Queue**: `/backend` is for API consumers; `/queue-backend` is for heavy indexing and data persistence.
- **Blockfrost Integration**: Centralized in `BlockfrostService`. Always use the fallback mechanism.
- **Incremental Patterns**: Always prefer delta-syncs over full refreshes to avoid API quota exhaustion.
- **Database Integrity**: Ensure `voltaire_db` tables (DReps, Proposals, Votes) stay synchronized with the latest ledger state.

## Execution Standards

### 1. Minimal Logging
- Logs should be sparse and meaningful.
- Avoid noisy logs in loops.
- Use `Logger` appropriately: `log` for major milestones, `warn` for non-critical issues, `error` for critical failures.

### 2. Professional Comments
- Delete "obvious" comments. If a line of code is clear, it doesn't need a comment.
- No "Step 1, Step 2..." style comments.
- Keep documentation close to the code but stay out of the way.

### 3. Aesthetic Standards
- Maintain consistent spacing and formatting.
- Prefer elegant, modern TypeScript patterns.
- Avoid boilerplate where possible.

### 4. No Placeholders
- Implement full logic. Do not leave "TODO" or "Future work" comments unless explicitly asked.

## Spec-Driven Development (SDD) Workflow
As per the DeepLearning.AI methodology, you must use a strict SDD workflow. No unstructured "vibe coding".

1. **Project Constitution**: Always respect the `.claude/docs/project-constitution.md`. It is your foundational source of truth.
2. **Read the Spec**: Before implementing any feature, ensure a spec exists in `.claude/docs/specs/`. If it doesn't, request one or help the user draft it using `.claude/docs/specs/template.md`. Never guess missing requirements.
3. **Strict TDD**: 
   - Write failing tests *first* based strictly on the spec's Test Cases.
   - Prove they fail.
   - Implement the minimum code required to make them pass.
4. **Roadmap**: Help the user keep `docs/roadmap.md` updated as features move from backlog to completion.
