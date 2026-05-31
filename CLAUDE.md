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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **www.1694.io** (5974 symbols, 10297 relationships, 187 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/www.1694.io/context` | Codebase overview, check index freshness |
| `gitnexus://repo/www.1694.io/clusters` | All functional areas |
| `gitnexus://repo/www.1694.io/processes` | All execution flows |
| `gitnexus://repo/www.1694.io/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
