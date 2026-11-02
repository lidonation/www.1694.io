# Blockfrost quota and resumable indexing

Source: Darlington's investigation/fix request and shared 80,000-request/day ceiling.
Started: 2026-11-02T09:30:21Z. Target: dev. This is a fix; no time logging.
The referenced `.claude/docs/project-constitution.md` and spec template are absent.

## Requirements
- R1: Classify 402/daily limit, 429, 401/403/418 and transient transport/5xx failures; preserve Retry-After and bound read retries.
- R2: Count every physical request before dispatch, including failed requests, retries, direct freshness probes and IPFS. Shared Postgres state protects both local clients/replicas. Missing configuration/storage fails closed.
- R3: Assume all routes share one budget unless explicitly verified/configured otherwise; identical credentials cannot have independent scopes. Never retry/fail over transaction POSTs.
- R4: Stop all nested worker loops on provider deferral; delay the same BullMQ job without spending failure attempts. Recurring/manual work reuses unfinished runs; serialize bulk writers.
- R5: Persist successful GET responses and target lists as staging, plus completed entity/phase markers; resume mid-item even with a one-request daily allowance. Application writes and checkpoints commit together in bounded chunks; failed chunks roll back while paid attempts remain charged.
- R6: Never reconcile deletions against incomplete pagination, or delete from a mutable snapshot staged across days. Preserve valid detail/metadata fields on failed fetches. Revalidate stake epoch on resume and invalidate old-epoch staging.
- R7: Diagnostic labels contain reason/route only, no credentials, addresses, payloads or endpoint paths.
- R8: Focused deterministic regression and real local Postgres integration tests; reviewed MR, rollout and remaining verification blockers documented. No provider, credential, schedule or deployment changes.

## Decisions / rollout blockers
- No batch allocation was approved. Both total application and batch limits default to zero (closed); an operator must set allocations whose sum across environments/services fits the organization ceiling before deployment.
- Budget/coordination is per application database. Separate databases or nonparticipating services are NOT globally capped. Use disjoint allocations; do not claim an organization-wide guarantee.
- Provider reset is configurable UTC hour; no reset time is asserted for the internal gateway. A 402 without Retry-After blocks for at least 24 hours, independent of a guessed boundary.
- Preview specs select the internal Koios gateway; runtime process/Secret inspection was RBAC-denied. Primary/fallback upstream relationship remains unverified; keep shared scopes.
- Request staging is private application data, never logs. Completed run staging is pruned on completion; unfinished staging survives restarts and days.
- Offset pagination is not a chain snapshot. Ascending immutable-history traversal plus staging avoids shifted newest-first pages; mutable delegator snapshots spanning UTC days are upsert-only, pending a later complete same-day reconciliation.
