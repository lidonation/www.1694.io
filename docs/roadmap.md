# Project Roadmap

This document tracks the iterative loops of Spec-Driven Development for the 1694.io platform.

## Current Milestones

### In Progress
- **Contabo IPFS migration (#244)**: Authenticated cluster REST transport, gateway reads and obsolete-setting deploy guards implemented. Dedicated credentials, Blockfrost rotation and preview/production rollout with three-peer verification remain operator prerequisites. See `docs/specs/05-contabo-ipfs.md` and `docs/ipfs-contabo-rollout.md`.
- **Internal Cardano API routing**: Backend and queue clients and Helm network selection implemented; gateway credential setup and in-cluster compatibility smoke checks remain operator rollout prerequisites. See `docs/specs/03-internal-cardano-api.md` and `docs/cardano-api.md`.
- **Budget Proposals freshness (issue #226)**: The page now identifies the 2025 archive and warns when data is older than 90 days. MR !478 targets `dev`; Catalyst Explorer refresh remains tracked in its own work item.
- **CNPG Database Migration**: Migrating from deprecated Bitnami postgresql-ha to CloudNativePG. Helm templates done, CI wired. Pending: operator cutover (retrieve voltaire password → update GLOBAL_ENV_FILE → run migration Job → remove Bitnami release). See `docs/specs/02-cnpg-database-migration.md`.

### Backlog (Pending Specs)
- Add testing framework integration (Jest configuration) across all monorepo apps to support TDD workflow.
- [Add upcoming features here]

### Completed
- **Governance Indexer Stabilization**: Fixed rollback loops and corrected Preview epoch anchors.
- **Apex Domain Routing**: Implemented Traefik Middleware redirect from `1694.io` to `www.1694.io`.
