# Cardano quota fix: rollout and verification

## Root cause and affected workers

A 402 was not an HTTP retry loop. Governance caught the failed delegator fetch and
continued to the next DRep; its transport tried fallback for each failure except 404.
Stake, proposal, DRep-vote and timeline workers also swallowed provider failures. Some
jobs reported success after truncated work. DRep detail failures could write null/default
fields over good data. Both Nest applications had separate uncoordinated clients, and
transaction POSTs used generic failover (and, in the queue, retries).

Preview evidence collected 2026-11-02 around 06:00 UTC: the latest 20,000 queue log lines
spanned about 30 minutes and contained 3,333 `402 / 402` primary/fallback failure pairs,
plus a completed-sync message. Both preview pod specifications selected the internal
Koios gateway. The cluster role denied both process inspection and Secret reads; **the
running Nest configuration and upstream account relationship were not verified**. An
exec shell's environment would not establish what the running ConfigService loaded.

## Required decisions before deployment

Do not enable this by merely accepting the proposed 10,000/day figure; it was **not
approved**. Set these non-secret values identically for backend and queue in each
application database's environment:

| Configuration | Meaning |
| --- | --- |
| `CARDANO_DAILY_LIMIT` | Total allowance for all this database's backend + queue requests; default 0 (closed), maximum 80,000. |
| `CARDANO_BATCH_DAILY_LIMIT` | Background allowance, default 0; must be <= total. Leave interactive headroom. |
| `CARDANO_QUOTA_RESET_UTC_HOUR` | Explicit verified UTC hour 0–23; required when total > 0. No internal-gateway reset is assumed. |
| `CARDANO_QUOTA_PRIMARY_SCOPE` | Provider quota group, default `shared`. |
| `CARDANO_QUOTA_FALLBACK_SCOPE` | Keep `shared` unless upstream independence is verified. |
| `CARDANO_QUOTA_IPFS_SCOPE` | Keep `shared` unless IPFS has a verified independent budget. |

All attempts are conservatively charged, including the internal gateway, direct probes,
IPFS, failed requests, retries and submissions. Different configured scopes still share
the application's total/batch allowance. Identical credentials cannot have independent
scopes. A 402 blocks its scope for at least 24 hours (or longer Retry-After), independent
of the configured calendar boundary. A 429 honors Retry-After with a 60-second minimum;
401/403/418 block for at least one hour. Transient GET failures get at most two short
backoffs before a shared one-minute cooldown; long Retry-After is deferred, not slept.

This is **not an organization-wide counter**: production, preview and other applications
with separate databases must receive disjoint allocations, with safety margin, whose
sum fits the approximately 80,000/day shared ceiling. Account for already-used requests
when enabling mid-period. After database restore/failover, reconcile against provider
usage before re-enabling: restored counters must not be assumed current. Caps cannot be
raised within an active period by another replica; the lower cap wins. Reset-hour
mismatches fail closed. Do not edit counters to bypass a denied request.

An operator should establish, without posting any secrets: the effective Nest-selected
primary/fallback routes, whether gateway requests consume the hosted account, whether
project credentials/accounts overlap, the reset rule, existing usage and allocations.
Startup logs report only `gateway` and `fallbackIndependent` booleans, reflecting the
configuration actually selected by the Nest client. No credential hashes are logged.

## Mechanics and data safety

Budget reservation commits **before** HTTP dispatch and is never refunded, even on a
timeout. Missing storage/configuration fails closed. PostgreSQL row locks serialize
admission across both applications and all replicas using that database.

BullMQ retains the same job on intentional deferral; normal failed-attempt limits are
not consumed. PostgreSQL stores unfinished runs, pinned target lists, successful GET
responses and completed entity markers. New scheduled/manual occurrences adopt an
unfinished run of the same queue/syncOnly scope and its original options. Old completed
continuations cannot start it over. Re-triggering the same scope recovers durable state
if its Redis job is lost; do not manually delete unfinished run rows.

A transaction-scoped advisory lock serializes bulk writers and works behind PgBouncer
transaction pooling. Data writes and staging/checkpoint changes use that same session
and commit together at intentional deferral. Chunks allow at most 50 new physical
attempts, or yield after 30 seconds when checked at the next dispatch (at least one
attempt may progress per chunk). These limits exclude cached replay and free external
metadata gateways; network calls remain bounded by timeouts. Unexpected failures roll
back the current chunk; earlier committed chunks remain. Paid attempts from a rolled-back
chunk stay charged and may need repeating later. Completed runs purge response staging.

Delegator deletion requires a complete successful fetch within a same-day run. Across
UTC days, reconciliation is **upsert-only**, with no synthetic undelegation events for
missing entries. A later complete same-day pass performs removals. Offset pagination
of mutable live delegations cannot provide an atomic chain snapshot; upstream snapshot
support is not claimed. Ascending history traversal and durable page/target staging
prevent continuation from drifting through freshly re-sorted target lists. DRep metadata
404s preserve existing fields. Stake continuations revalidate freshness/epoch and discard
old-epoch staging; they never label cached prior-epoch values as the new epoch.

Transaction submissions are admitted once and dispatched once: no HTTP retry, redirect
or fallback. A transport/5xx result returns `SUBMISSION_OUTCOME_UNKNOWN`; reconcile the
deterministic transaction hash before a human/client retries it. No live transaction was
submitted during verification.

## Human rollout checklist

- [ ] Verify account/reset relationship and approve disjoint allocations/headroom.
- [ ] Configure the non-secret limits/reset in both backend and queue; keep shared scopes.
- [ ] Review/merge the MR through normal protections; no merge or deployment was performed.
- [ ] Run `app-preview` manually only when ready. Ensure the new backend migration
      `1793611800000-CardanoRequestBudget` completes before new queue processing.
- [ ] Ensure old queue/backend replicas that bypass accounting are drained/replaced before
      trusting counts. Do not leave a mixed old/new worker fleet processing the same queue.
- [ ] In isolated preview, use a deliberately tiny allocation to observe `deferred`,
      `reason`, `nextRunAt`, an unfinished run and unchanged failed-attempt count. Verify
      a later resume completes without duplicate logical rows or null overwrites.
- [ ] Confirm a 402 stops the request stream rather than producing one failure per DRep;
      confirm a simultaneous manual trigger does not repeatedly probe the exhausted scope.
- [ ] Check frontend/API reads still have reserved capacity and source epoch is fresh.
- [ ] Only after preview verification, explicitly authorize the manual `app-production`
      job and perform the same smoke checks there. No production schedules need changing.

Rollback must not restart old unmetered workers into an exhausted provider. Leave the
additive tables in place; stop/drain processing with explicit operator authorization
before reverting images. Dropping budget state discards accounting and is not a safe
quota reset.

## Local verification commands

```sh
(cd queue-backend && yarn test --maxWorkers=6 && yarn build)
(cd backend && yarn test --maxWorkers=6 && yarn tsc --project tsconfig.prod.json --noEmit)
# Dedicated temporary local Postgres and Redis only:
(cd queue-backend && QUOTA_TEST_DB_URL=postgres://postgres@127.0.0.1:55439/postgres yarn ts-node test/quota.integration.ts)
(cd queue-backend && QUOTA_TEST_REDIS_PORT=56439 yarn ts-node test/quota-bullmq.integration.ts)
```

Integration tests create/drop only a uniquely named schema and uniquely named BullMQ
queue in those dedicated test services. No real provider HTTP requests or transactions
are required. CI status is not inferred from local results. Type-aware ESLint is run for
changed packages; legacy `any`/async style warnings remain, with no lint errors.
