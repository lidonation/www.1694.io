# Platform Specification: 1694.io — Voltaire DRep Campaign Platform

**Status**: Living document — authoritative
**Version**: 1.0 (2026-08-14)
**Target Components**: Frontend · Backend · Queue-Backend · Governance Indexer · Infrastructure
**Supersedes**: `01-delegation-transfer-events.md`, `02-cnpg-database-migration.md`, `03-redis-operator-migration.md`, `04-governance-action-card-enrichment.md` — all four are folded into §10 of this document with their original status preserved.
**Reads with**: `.claude/docs/project-constitution.md` (principles), `.claude/docs/roadmap.md` (sequencing), `.claude/docs/specs/template.md` (format for new feature specs).

This document is derived from a full scan of the repository at commit `859cdc7e` on branch `dev`. Every statement below describes the system as it actually exists unless it is explicitly marked **Required** (a rule the implementation must satisfy) or **Gap** (a known divergence). Where behaviour and documentation disagree, this document records the behaviour and flags the documentation.

---

## 1. Mission and Scope

1694.io is the Voltaire DRep Campaign Platform: an explorer and campaign-management tool for Cardano's CIP-1694 governance era. It exists so that:

- **DReps** can claim an on-chain identity, publish a campaign profile with CIP-119 metadata, post notes, and see a timeline of their registrations, delegations, and votes.
- **Delegators** can discover and compare DReps, inspect voting records and delegation weight, and delegate on-chain from the browser.
- **Everyone** can browse governance actions and budget proposals with their thresholds, lifecycle state, and vote tallies.

The platform is a web2/web3 hybrid: off-chain campaign content lives in Postgres, on-chain truth is indexed from the Cardano chain, and all writes to chain are signed in the user's own wallet.

Out of scope for this document: the Rust `governance-indexer` source (a separate repository, consumed here as a prebuilt image) and the external GovTool/proposal-discussion service (consumed as an HTTP API).

---

## 2. System Architecture

### 2.1 Components

| Component | Path | Runtime | Port | Responsibility |
|---|---|---|---|---|
| Frontend | `frontend/` | Next.js 15 (App Router), React 19 | 3000 | All user interaction; wallet connection, transaction building, signing |
| Backend API | `backend/` | NestJS 11, TypeORM 0.3 | 8000 | HTTP read/write API, auth, schema ownership (migrations) |
| Queue Backend | `queue-backend/` | NestJS 11, BullMQ 5 | 9999 | Scheduled and triggered indexing workers; Bull Board at `/queues` |
| Governance Indexer | external image | Rust | — | Chain follower; writes `drep_timeline_event` and `sync_checkpoint` |
| Postgres | CloudNativePG | PostgreSQL 17.5 | 5432 | Single shared database (`1694` preview, `1694_mainnet` production) |
| Redis | OpsTree operator | Redis 8.4 | 6379 | BullMQ broker only — not an application cache |

### 2.2 Data flow

```
Cardano chain ──► governance-indexer (Rust, N2N relays)
                        │ writes raw events
                        ▼
                 drep_timeline_event ──► TimelineWatcherWorker (every minute)
                                              │ fans out
                                              ▼
                        governance-sync · proposals-sync · drep-votes-sync · stake-sync
                                              │ enrich via Blockfrost + IPFS
                                              ▼
                    dreps · drep_delegators · proposals · proposal_metadata · proposal_votes
                                              │
                        Backend API (read) ◄──┘
                                              │
                                        Frontend (react-query)
                                              │ builds + signs tx
                                              ▼
                        POST /misc/submit-tx ──► Blockfrost ──► chain
```

**Required**: the chain is the source of truth for DRep identity, delegation, proposals, and votes. Campaign content (notes, comments, reactions, attachments, claimed profiles) is platform-owned and never reconstructed from chain.

### 2.3 Architectural rules

**Required**

1. `backend/` serves API consumers. It must not perform heavy indexing. Its only queue interaction is enqueuing `drep-claim` jobs; `QueueService` throws for any other queue.
2. `queue-backend/` owns all indexing and bulk persistence. It must not own schema — `synchronize: false`, no migrations; the backend runs migrations.
3. All chain reads by either Nest app go through `BlockfrostService`, using the primary → fallback project pair. No app talks to db-sync.
4. Prefer delta syncs over full refreshes; force-refresh paths exist but are operator-triggered only.
5. The Rust indexer stays stateless: it extracts raw events and writes them; all derivation and enrichment happens in `queue-backend`.

---

## 3. Data Model

Single Postgres database, two logical groups of tables.

### 3.1 Platform tables (campaign side)

All extend `BaseEntity` (`backend/src/global/base.entity.ts`): serial `id`, `createdAt`, `updatedAt`, `deletedAt` (soft delete).

| Table | Key columns | Notes |
|---|---|---|
| `drep` | `id` | Platform-side claimed DRep record; links to `dreps.voltaire_drep_id` |
| `signature` | `drep_bech32`, `voterId`, `stakeKey`, `signature`, `signatureKey`, `lastSignedIn`, `type` | Identity of a logged-in user; JWT subject |
| `note` | `title` (unique), `tag` (simple-array), `content`, `visibility` | DRep posts |
| `comment` | `content`, `parentEntity` (`note`\|`comment`), `parentId`, `voter` | Self-referencing threads |
| `reaction` | `type` (`like`\|`thumbsup`\|`thumbsdown`\|`rocket`), `parentEntity`, `parentId`, `voter` | Unique on (voter, type, parentId, parentEntity) |
| `attachment` | `name` (unique), `url` **bytea**, `parententity`, `parentid`, `attachmentType` | Binary stored in-row; IPFS variants stored by hash |
| `notification` | `title`, `message`, `type`, `isRead`, `isArchived`, `isPersistent`, `recipient` | In-app only |
| `oauth` | `provider` (`govtools`), `accessToken`, `refreshToken`, `expiresAt`, `providerUserId`, `stakeKeyBech32`, `metadata` (json) | External-service tokens |
| `synctime` | `lastSyncTime` | Legacy sync marker |
| `sync_state` | `key` PK, `last_processed_id`, `updated_at` | Watermarks; `timeline_watcher_last_id` |

### 3.2 Governance tables (chain side)

| Table | Key columns | Notes |
|---|---|---|
| `dreps` | PK `drep_id`; `hex`, `amount_lovelace`, `active`, `active_epoch`, `has_script`, `retired`, `expired`, `last_active_epoch`, `metadata` **jsonb**, `voting_power_ada` numeric(30,6), `delegation_vote_count`, `governance_vote_count`, `is_claimed`, `voltaire_drep_id`, `snapshot_epoch_no` | CIP-119 metadata held whole in `metadata`; GIN trigram index on the unwrapped `givenName` |
| `drep_delegators` | PK (`drep_id`, `stake_address`); `amount_lovelace`, `voting_power_lovelace` | Current delegation set |
| `drep_timeline_event` | bigserial `id`; `event_type` (registration\|retirement\|delegation\|undelegation\|proposal\|vote), `timestamp`, `epoch`, `slot`, `tx_hash`, `block_hash`, `drep_id`, `stake_address`, `previous_drep`, `metadata` **jsonb** | Written by the Rust indexer; GIN index on `metadata` |
| `proposals` | PK `id` (CIP-129); `tx_hash`, `cert_index`, `governance_type`, `governance_description` **jsonb**, `deposit_lovelace`, `return_stake_address`, `ratified_epoch`, `enacted_epoch`, `dropped_epoch`, `expired_epoch`, `expiration_epoch`, `block_time` | Unique (`tx_hash`, `cert_index`) |
| `proposal_metadata` | PK `proposal_id`; `url`, `hash`, `json_metadata` **jsonb**, `bytes`, `version` (`v1`\|`v2`), `error` **jsonb** | Off-chain anchor content; `error` records permanent fetch failure |
| `proposal_votes` | bigserial `id`; `proposal_id`, `tx_hash`, `cert_index`, `voter_role` (constitutional_committee\|drep\|spo), `voter`, `vote` (yes\|no\|abstain), `block_time`, `voting_power_lovelace` | Unique (`proposal_id`, `voter`) |
| `drep_epoch_stake` | bigserial `id`; `drep_id`, `epoch_no`, `amount_lovelace`, `active`, `snapshotted_at` | Per-epoch voting-power snapshot; unique (`drep_id`, `epoch_no`) |
| `sync_checkpoint` | `worker_id` PK, `last_slot`, `last_hash`, `updated_at` | Written by the Rust indexer only |

### 3.3 Schema rules

**Required**

1. Migrations live in `backend/src/migrations/` and are the only way the schema changes. `migrationsRun` is on outside development; `synchronize` is never enabled.
2. Governance entity definitions are duplicated in `backend/src/entities/governance/` and `queue-backend/src/entities/governance/`. Both copies must be updated together until the duplication is resolved (see §12, DEBT-1).
3. `backend/src/typeorm.config.ts` must include the `entities/governance/*` glob so CLI-generated migrations see governance entities. **Gap** — it currently does not.
4. Search on DRep names uses Postgres `pg_trgm` (extension and GIN index created by migration `1780250000000`). No external search engine is used or permitted without a new spec.

---

## 4. Backend API

Bootstrap (`backend/src/main.ts`): 50 MB JSON/urlencoded body limit, `enableCors()` open, listens on `PORT` (default 8000). No global prefix.

### 4.1 Authentication

- Wallet-signature login, exchanged for a JWT valid 24 hours (`JwtModule`, secret `JWT_SECRET`).
- Two login methods on `POST /auth/login` (`UnifiedLoginDto.method`): `hot_wallet` (CIP-30/CIP-95 message signing) and `login_file` (offline signed key file).
- The token is carried in a **non-standard header**: `Authorization-1694: Bearer <jwt>`. The plain `Authorization` header is reserved for the external GovTool/PDF service token and is passed through on proxy endpoints.
- `JwtStrategy.validate()` re-checks the payload against the `signature` table on every request; an orphaned token is rejected.
- JWT payload: `{ sub (signature.id), stakeKey, voterId?, drepId?, drep_bech32?, signatureKey }`.

**Required**: any endpoint that mutates user-owned content is guarded by `JwtAuthGuard`.

**Gap (SEC-1)**: `/comments/:parentId/:parentEntity/add` and `/remove` are unguarded — anyone may post or delete comments with an arbitrary `voter` value. This must be guarded.

### 4.2 Route surface

| Prefix | Endpoints | Guard |
|---|---|---|
| `/healthz` | `GET /live`, `/ready`, `/memory` | none |
| `/auth` | `POST /login`; `POST /signatures/verify`, `/login/verify-sigs`, `/login/link-sigs-to-drep`, `/witnesses/verify`; OAuth `GET /oauth/providers`, `/oauth/provider`, `/oauth/provider/check`, `POST /oauth/add`, `/oauth/refresh`, `/oauth/update`, `DELETE /oauth/delete` | none |
| `/dreps` | `GET /` (list: `s`, `page`=1, `perPage`=24, `sort`, `order`, `onChainStatus`, `campaignStatus`, `includeRetired`, `type`); `GET /verify-ownership`, `/epochs/latest/parameters`, `/media`; `GET /:id/drep`, `/:voterId/voter`, `/:voterId/activity`, `/:voterId/metadata`, `/:voterId/stats`, `/:voterId/is-registered`, `/:voterId/delegators`, `/:voterId/gov-actions-votes`, `/:stakeKey/profile-data`, `/:voterId/claimed-profiles`, `/:voterId/governance-participation`; `POST /metadata/validate` | JWT on `POST /new`, `POST /:id/update`, `POST /metadata/save` |
| `/voters` | `GET /:voterIdentity`, `/:stakeKey/delegation`, `/:voterIdentity/governance-actions` | none |
| `/notes` | `GET /all`, `/:id/single`; `POST /new`, `/:id/update` | JWT on writes |
| `/comments` | `GET /:parentId/:parentEntity`; `POST /:parentId/:parentEntity/add`, `/remove` | **none — see SEC-1** |
| `/reactions` | `POST /add`, `/remove` | JWT (controller-level) |
| `/notifications` | `GET /:recipientId/all`; `POST /:recipientId/new`, `/:notificationId/read`, `/:notificationId/unread` | JWT (controller-level) |
| `/attachments` | `GET /:attachmentName`, `/ipfs/:ipfsHash`; `POST /add` (multipart `attachment`), `/ipfs/add` | none |
| `/proposals` | `GET /?query=`, `GET /:id` | none |
| `/actions-proposals` | `GET /`, `/:id`, `/:id/comments`, `/:id/polls`; `POST /:id/comments`, `/poll/votes` | proxied caller auth |
| `/metrics` | `GET /`, `/catalyst-proposals/:username` | none |
| `/misc` | `GET /epochs/first`, `/tx/:hash/exists`, `/address/:address/utxos`, `/stake-addr/:address/payment`, `/metrics`, `/proposal/:hash/metadata`, `/metadata?url=`; `POST /submit-tx` | none |

### 4.3 Validation

- CIP metadata validation is real and enforced: Joi schema (`backend/src/common/schemas/cipMetadataSchema.ts`) plus JSON-LD normalization, used by `POST /dreps/metadata/validate`.
- Query-parameter coercion uses `ParseIntPipe` / `DefaultValuePipe`.

**Gap (SEC-2)**: `class-validator` decorators exist on several DTOs but **no global `ValidationPipe` is registered**, so body validation does not run. Required fix: register `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))` and reconcile DTOs before relying on them.

### 4.4 Response conventions

**Required**

- List endpoints return `{ data, pagination: { page, perPage, total, totalPages } }`.
- Upstream failures are re-thrown as `HttpException` carrying the upstream status; an exhausted IPFS chain raises 502.

**Gap (PERF-1)**: `GET /dreps` loads every matching DRep into memory and performs two unbounded raw scans (`proposal_votes`, `drep_delegators`) per request, then paginates in JavaScript. Acceptable at ~2k DReps; must be moved into SQL before the DRep set grows or before this endpoint is put behind heavy traffic.

---

## 5. Indexing and Background Work

### 5.1 Queues and jobs

Six BullMQ queues (`queue-backend/src/queue.types.ts`): `drep-claim`, `stake-sync`, `governance-sync`, `drep-votes-sync`, `proposals-sync`, `timeline-watcher`. Bull Board is mounted at `/queues`.

Defaults (`queue.constants.ts`): `attempts: 3`; `removeOnComplete`/`removeOnFail` `{ age: 3600s, count: 1000 }`; `LOCK_DURATION_MEDIUM` 10 min; `LOCK_DURATION_HEAVY` 30 min (BullMQ's 30 s default is too short for these syncs).

| Worker | Queue | Lock / concurrency | Behaviour |
|---|---|---|---|
| `DrepClaimWorker` | `drep-claim` | concurrency 10 | Finds an active, non-retired DRep for a stake key and auto-claims it: transactional insert into `drep` plus insert/update of `signature`. Rethrows on failure, so it retries. |
| `StakeSyncWorker` | `stake-sync` | 10 min | Aborts unless `assertGovernanceSourceFresh()` passes. Per DRep: `getDRepInfo`, writes `voting_power_ada`, `active`/`retired`/`expired`, `snapshot_epoch_no`; upserts `drep_epoch_stake` in chunks of 500; refreshes up to 100 stale delegator voting powers. |
| `GovernanceSyncWorker` | `governance-sync` | 30 min | Four phases selectable by `syncOnly`: `dreps`, `delegators` (diff insert/update/delete plus synthetic `undelegation` events), `proposals`, `metadata-votes`. |
| `ProposalsSyncWorker` | `proposals-sync` | 30 min | Pages the proposal list; backfills metadata where missing or where `proposal_metadata.error IS NOT NULL` (limit 500). |
| `DrepVotesSyncWorker` | `drep-votes-sync` | 10 min | Per DRep by voting power desc, pages `/governance/dreps/{id}/votes`, backfills `block_time`, upserts votes, recomputes `governance_vote_count`. Early-exits a DRep when >80 of 100 rows on a page already exist and `forceRefresh` is false. |
| `TimelineWatcherWorker` | `timeline-watcher` | default | Reads new `drep_timeline_event` rows in batches of 50 past the `timeline_watcher_last_id` watermark; derives undelegation events; fans out to the other syncs on `registration`/`retirement`/`proposal`/`vote`. |

### 5.2 Schedules

Registered on module init with static job ids (`queue-backend/src/scheduler/job-scheduler.service.ts`):

| Job | Cron |
|---|---|
| `stake-sync` | `0 * * * *` (hourly) |
| `governance-sync` | `0 0 * * *` (daily) |
| `proposals-sync` | `0 */6 * * *` (6-hourly) |
| `drep-votes-sync` | `0 0 * * 0` (weekly, Sunday) |
| `timeline-watcher` | `*/1 * * * *` (every minute) |

### 5.3 Manual triggers

HTTP (`/sync-trigger`, currently unauthenticated — **Gap SEC-3**, must be restricted at the ingress or by a guard): `POST stake/trigger`, `governance/trigger` (`{forceRefresh?, syncOnly?}`), `proposals/trigger`, `drep-votes/trigger`, `timeline-watcher/trigger`; `GET governance/status`, `blockfrost/test/:drepId`.

CLI, via Makefile → `queue-backend/scripts/trigger-jobs.ts`: `make sync-governance[-force]`, `sync-proposals[-force]`, `sync-drep-votes[-force]`, `sync-stake`, `sync-all[-force]`, `quick-sync`.

### 5.4 External sources and resilience

**Blockfrost** is the sole chain data source for both Nest apps. Endpoints used: `/blocks/latest`, `/epochs/latest`, `/epochs/{n}`, `/epochs/latest/parameters`, `/accounts/*`, `/addresses/{addr}/utxos`, `/tx/submit`, `/txs/{hash}`, `/governance/dreps[/{id}][/metadata|/delegators|/votes]`, `/governance/proposals[...]`.

**Required**

1. Every Blockfrost call uses the primary project and falls back to the secondary on failure; 404 does not trigger fallback.
2. Retries are exponential (`retryRequest`, 3 attempts, 1 s base) on `ECONNRESET`, `ETIMEDOUT`, 429 and 5xx.
3. `assertGovernanceSourceFresh()` runs before any sync that overwrites voting power. It aborts when the primary lacks governance support (`/epochs/latest` 404) or lags chain tip (`primaryEpoch < tipEpoch`). Stale data must never overwrite good data.
4. Request pacing is explicit: 20 ms between DRep info calls, 50 ms per detail call or vote upsert, 100 ms per page, 200 ms per DRep in delegator sync.
5. Proposal metadata resolution follows the chain: Blockfrost metadata → anchor URL recovered from `drep_timeline_event.metadata->>'action_id'` → manual fetch across `ipfs.io`, `cloudflare-ipfs.com`, `dweb.link`, `gateway.pinata.cloud`, each verified by blake2b-256 hash. A hash mismatch moves to the next gateway; permanent failure is recorded in `proposal_metadata.error`.

**Gap (REL-1)**: `backend`'s copy of `BlockfrostService` has fallback but **no retry** and no freshness assertion. It has drifted from the `queue-backend` copy.

**Gap (REL-2)**: all workers except `DrepClaimWorker` catch errors and return `{ success: false, message }`. A returned failure is **not** retried by BullMQ, so transient failures are silently swallowed. Required: rethrow on retryable errors, or record failure explicitly so it is visible in Bull Board.

---

## 6. Governance Indexer (Rust)

Deployed as a prebuilt image `registry.2lovelaces.io/voltaire/governance-indexer`, built and released from its own project; this repo consumes it only.

- Connects over N2N to `RELAY_ADDRESSES` (three mainnet relays), `NETWORK_MAGIC=764824073`, `MAX_CONCURRENT_WORKERS` 8 (preview) / 16 (production), `BATCH_SIZE=100`, `RUST_LOG=info`.
- Writes `drep_timeline_event` and `sync_checkpoint`. `DATABASE_URL` is composed in-pod from the CNPG app secret `www-1694-cnpg-cluster-app` against `www-1694-cnpg-pooler:5432`.
- Deployed by the indexer project's pipeline triggering `deploy-indexer-preview` / `deploy-indexer-production` here, with `helm upgrade --reuse-values --set governanceIndexer.image.tag/sha`; the `sha` becomes a pod annotation so a mutable tag still forces a rollout.

**Required**

1. The indexer stays stateless — no state lookups, no in-process caches for derivation. Raw events only.
2. Rollbacks are handled by deleting timeline events newer than the rollback slot. Any event the platform synthesizes must share the slot of its source event so it is removed by the same rollback.
3. Operator runbook: `GOVERNANCE_INDEXER_DEPLOYMENT.md`; logs via `kubectl logs -f deployment/www-1694-governance-indexer -n <ns>`.

---

## 7. Frontend

### 7.1 Framework and rendering

Next.js 15.3 App Router, React 19, TypeScript 5.9, yarn. `output: standalone`, `reactStrictMode: true`, `withNextIntl()` wrapper, WebAssembly enabled for the Cardano serialization library.

Every page except `loading.tsx`, the locale layout and `not-found.tsx` is `'use client'`. There are no server actions, no `generateMetadata`, no revalidation, and no frontend API routes — in practice the app is a client-side SPA inside the App Router.

**Gap (FE-1)**: no server-rendered metadata for DRep or proposal pages, so those pages have no SEO surface. Fixing this requires a spec of its own.

### 7.2 Routes

All routes are locale-prefixed (`/en`, `/de`) by `src/middleware.js`.

| Route | Purpose |
|---|---|
| `/[locale]` | CIP-1694 explainer; content fetched client-side from the CIPs repo on GitHub |
| `/[locale]/dreps` | DRep hub: intro, info, pick-a-DRep, governance actions card |
| `/[locale]/dreps/list` | Searchable, filterable, paginated DRep table (`s`, `page`, `sort`, `order`, `on_chain`, `include_retired`, `campaign`, `type`) |
| `/[locale]/dreps/[drepid]` | DRep profile; owner-only profile bar when the connected wallet matches (CIP-105 legacy conversion) |
| `…/[drepid]/timeline` | Activity timeline (desktop / mobile / waterfall variants) |
| `…/[drepid]/votes` | Voting history, card list, 10 per page |
| `…/[drepid]/delegators` | Delegator list |
| `/[locale]/dreps/notes` | Notes feed with comments and reactions |
| `…/workflow/notes/new`, `…/[noteid]/update` | Note authoring; forces login modal when disconnected |
| `…/workflow/profile/new` | Claim/create profile (`?drep=` supplies the id to claim) |
| `…/workflow/profile/update/step1..4` | Four-step profile wizard with progress bar |
| `…/workflow/profile/success` | Polls `checkTxExists(hash)` every 10 s until the tx is on chain |
| `/[locale]/proposals` | Governance-action list; filters `search`, `categories`, `committees`, `sort`, `order`; 12 per page, 300 ms debounce |
| `/[locale]/proposals/[proposalid]` | Proposal detail: details, polls, vote results, DRep voting section, comments, creator's Catalyst participation |
| `/[locale]/voters/[voterId]` | Voter dashboard: wallet stats, delegation history |
| `…/voters/[voterId]/impact` | Voter's governance actions, paginated |

**Gap (PERF-2)**: the proposals list issues a second query with `pageSize = 10000` on every page view to populate metrics/download. Required: replace with a dedicated aggregate endpoint.

### 7.3 UI and styling

- MUI v6 (Emotion) and Tailwind v4 side by side. No shadcn, no Radix.
- Tailwind is configured CSS-first via `@theme` in `src/assets/styles/globals.css` — there is no `tailwind.config.*`. Palette anchored on Cardano blue `#0033ad`; custom breakpoints `3xl: 1840px`, `4xl: 2160px`.
- MUI theme in `src/assets/theme.ts`: pill buttons (radius 50), black tooltips, borderless 50px-radius inputs, Poppins 400 only. Single light theme; no dark mode.
- Components organised atoms (71) / molecules (47) / organisms (20) plus feature folders (`1694.io/`, `proposals/`, `voters/`, `Loaders/`).
- Rich text: TipTap 2 plus MDXEditor, react-markdown with KaTeX.

**Required**: no new colour tokens. All styling uses existing design-system tokens (`bg-success`, `bg-extra_red`, `bg-complementary-*`, `bg-primary-*`, `bg-secondary-*`, `bg-extra_gray`, `bg-general-*`). All layouts are mobile-first and wrap rather than overflow.

**Gap (I18N-1)**: `next-intl` is wired with locales `en`/`de`, but both message bundles are 66 bytes and identical, `useTranslations` is used in zero files, and all copy is hardcoded English — so `/de` renders English. There are also two competing request configs (`src/i18n.js` and `src/i18n/request.ts`), and the custom middleware's `startsWith('/en')` check would mis-handle a path like `/energy`.

### 7.4 Data and state

- Server state: `react-query` v3 (legacy package), single client, `refetchOnWindowFocus: false`, ~40 hooks with keys centralised in `src/constants/queryKeys.ts`.
- Client state: React Context, composed in `src/context/context.js`; `globalContext.tsx` (~1350 lines) holds wallet state, user/claim state, epoch params, the modal registry, and all transaction builders.
- Persistence: `localStorage`, `sessionStorage`, and IndexedDB (`idb`) for the login key file.
- API client: `src/services/axiosInstance.ts`, `baseURL = NEXT_PUBLIC_BASE_URL_API`, 30 s timeout; attaches `Authorization-1694` to every request and the GovTool `Authorization` token to non-GET requests only.

**Gap (FE-2)**: the 1694 token is written with a localStorage helper and read with a sessionStorage helper. Reconcile to one store.

### 7.5 Wallet and transactions

- Libraries: `@meshsdk/core` for wallet discovery, `@emurgo/cardano-serialization-lib-asmjs` for CSL, `bech32`, `blakejs`, `jwt-decode`. No Lucid.
- Two providers registered against `AuthenticationProvider`:
  - `hot_wallet` — `BrowserWallet.enable(name, [{cip: 95}])` with a plain-enable fallback; **enforces network match** against `CONFIGURED_NETWORK_ID`; drops to the raw CIP-30 object for signing to avoid bech32 issues in the high-level SDK.
  - `login_file` — offline path; signed key file kept in IndexedDB and replayed; verified via `POST /auth/signatures/verify`.
- Transaction types: `loginViaMessageSigning`, `loginViaExpiredTxnSigning`, `delegationTxn`, `submitMetadataTxn`. Message signing uses CIP-95 `signData`; tx signing uses `signTx(txHex, true)` returning vkey witnesses; an unsigned `Unwitnessed Tx ConwayEra` file is produced for the cold path.
- Certificate builders on the context: `buildStakeKeyRegCert`, `buildVoteDelegationCert`, `buildDRepRetirementCert`, `buildDRepUpdateCert`, `buildVote`.
- Delegation composes retirement (if sole voter) + stake-key registration (if unregistered) + vote delegation, submits via `POST /misc/submit-tx`, then polls.
- Metadata is CIP-100/108/119 JSON-LD, hashed with blake2b, anchored, with the witness embedded under `authors → witness{Ed25519, publicKey, signature}`.

**Required**: the platform never holds a private key. Every on-chain write is signed in the user's wallet or offline key file.

### 7.6 Environment variables

`NEXT_PUBLIC_BASE_URL_API`, `_BASE_URL_GOVTOOL`, `_BASE_URL_GOVTOOL_API`, `_BASE_URL_EXPLORER`, `_BASE_URL_ADASTAT`, `_IPFS_GATEWAY`, `_PDF_BASE_URL`, `_NETWORK_ID`, `_NETWORK_MODE`, `_FATHOM_ENVIRONMENT_ID`, `_SPROUT_ENVIRONMENT_ID`. Because these inline at build time, `frontend/scripts/entrypoint.sh` rewrites placeholders across `/app/.next/` at container start so one image serves both environments.

**Gap (CFG-1)**: `_BASE_URL_ADASTAT` is used in code but missing from `.env.example`; `uuid` is imported in three files but is not declared in `package.json` (it resolves transitively today).

---

## 8. Security Requirements

**Required**

1. No secret is ever committed. All runtime secrets arrive as GitLab File/masked variables and are rendered into Kubernetes Secrets at deploy time.
2. Database credentials are read from the CNPG-generated secret, never from values files.
3. All user writes require a verified wallet signature and a valid JWT.
4. Uploaded and fetched off-chain content is hash-verified where a hash exists (proposal metadata, DRep metadata).

**Open findings**

| Id | Finding | Action |
|---|---|---|
| SEC-1 | Comment add/remove endpoints are unguarded | Add `JwtAuthGuard`; derive `voter` from the token, not the body |
| SEC-2 | No global `ValidationPipe`; DTO decorators are inert | Register the pipe with `whitelist: true`; audit DTOs first |
| SEC-3 | `/sync-trigger/*` is unauthenticated and Bull Board is served at `/queues` | Restrict both at the ingress or behind a guard |
| SEC-4 | Real-looking Postgres credentials are committed at `config/secrets/postgres_password` (unused by any service) | Treat as leaked: rotate, delete the files, scrub history |
| SEC-5 | `enableCors()` is fully open | Restrict to the known frontend origins per environment |

Handled deliberately, not a finding: the app talks to the pooler with credentials it never logs, and the indexer image is pulled with node-level registry auth rather than an in-cluster pull secret.

---

## 9. Infrastructure and Delivery

### 9.1 Helm chart

`chart/` — name `www-1694`, version 0.1.1. No subcharts; stateful services are operator CRDs. Templates: three app Deployments plus the indexer, three Services, frontend/apex/backend Ingresses with a Traefik redirect Middleware, the CNPG cluster/pooler/migration job, the OpsTree Redis CRD, and four Secrets built from chart-local env files via `.Files.Lines`.

| Environment | Values | Namespace | Hosts | Database | Replicas (fe/be/queue) |
|---|---|---|---|---|---|
| Preview | `values.yaml` | `voltaire-preview` | `sancho.1694.io`, api `preview-api.1694.io` | `1694`, 50Gi | 1 / 1 / 1 |
| Production | `values.yaml` + `values.prod.yaml` | `voltaire-mainnet` | `www.1694.io` (apex redirect from `1694.io`), api `api.1694.io` | `1694_mainnet`, 200Gi | 5 / 5 / 2 |

Ingress: `ingressClassName: traefik`, cert-manager `letsencrypt-issuer`, entrypoints `websecure,web`, middlewares `traefik-redirect-http-to-https@kubernetescrd` and `traefik-default-headers@kubernetescrd`; the backend ingress sets `router.priority: "1000"`. TLS secret `wildcard-1694-tls`.

Rollouts: all Deployments use `RollingUpdate` with `maxUnavailable: 0`.

**Gap (INFRA-1)**: container resources for frontend/backend/queue are hardcoded in the templates rather than values-driven, so they cannot differ per environment. **Gap (INFRA-2)**: the TLS host entry is quoted as `"'*.1694.io'"` and likely renders with literal quotes. **Gap (INFRA-3)**: `imageCredentials`, `certmanager`, `certificate`, `app`, `serviceAccount`, `affinity`, `nodeSelector` and the top-level `resources`/`replicaCount`/`service` blocks in `values.yaml` are referenced by no template — dead config that should be deleted (it also contains a stale registry username/password pair).

### 9.2 Stateful services

- **Postgres — CloudNativePG**, `Cluster www-1694-cnpg-cluster`, 2 instances, `ghcr.io/cloudnative-pg/postgresql:17.5`, longhorn storage, requests 250m/512Mi, limits 4 CPU/8Gi. Tuning: `max_connections 200`, `shared_buffers 256MB`, `effective_cache_size 2GB`, `work_mem 16MB`, `maintenance_work_mem 256MB`, `wal_buffers 16MB`, `log_min_duration_statement 2000`.
- **PgBouncer** — `Pooler www-1694-cnpg-pooler`, 2 instances, type `rw`, transaction mode, `max_client_conn 200`, `default_pool_size 20`, PodMonitor enabled. All app connections go through the pooler.
- **Redis — OpsTree operator**, `Redis www-1694-redis-cluster`, standalone (`clusterSize 1`, 0 followers), `quay.io/opstree/redis:v8.4.0`, longhorn 5Gi, `allkeys-lru`, AOF on / RDB off, `oliver006/redis_exporter:v1.55.0` sidecar.
- **Cardano node access**: the queue pod reaches an external relay through a `socat` sidecar exposing a UNIX socket at `/ipc/node.socket` on an emptyDir. Static node/db-sync configs for preview and sanchonet live in `cardanonode/config/network/`; no node or db-sync runs in this chart.

**Gap (INFRA-4)**: **no WAL archiving and no backups.** Spec 02 deferred `ObjectStore`, `ScheduledBackup` and the Barman plugin. This is the single highest-severity operational gap in the platform — production data has no point-in-time recovery. A backup spec is required.

**Gap (INFRA-5)**: the Redis CRD has no auth. Spec 03 required the password to come from `www-1694-global-secrets` key `REDIS_PASSWORD`; the rendered resource references no secret and the app deployments set `REDIS_PASSWORD: ""`.

**Gap (INFRA-6)**: `chart/values.postgresql.yaml` (2216 lines) and `chart/values.redis.yaml` (1349 lines) are orphaned Bitnami values, referenced by no chart, CI job, or Makefile target. Delete once the Bitnami releases are confirmed removed.

### 9.3 CI/CD

`.gitlab-ci.yml`, stages `build`, `preview`, `production`, `test`.

- `build_frontend` / `build_backend` / `build_queue_backend` — docker:27-cli, build from repo root with `-f <svc>/Dockerfile`, push `:$CI_APPLICATION_TAG` and `:latest`. Tag is `${APP_VERSION}-${CI_PIPELINE_ID}` where `APP_VERSION` comes from `frontend/package.json`. Gated on `DEPLOY_WEBSITE == "true"`.
- `app-preview` — manual, environment `preview`, needs all three builds; copies env files into `chart/`, then `helm upgrade --install www-1694.$CI_ENVIRONMENT_SLUG ./chart -f values.yaml --timeout 600s --wait --create-namespace`.
- `production` — manual, rule `$CI_COMMIT_BRANCH == "main" && $DEPLOY_WEBSITE == "true"`, needs `app-preview`, adds `-f ./chart/values.prod.yaml`.
- `deploy-indexer-preview` / `deploy-indexer-production` — triggered by the indexer project's pipeline (`$CI_PIPELINE_SOURCE == "pipeline"` with `$INDEXER_TAG`/`$INDEXER_SHA`; production additionally requires `INDEXER_TAG == "latest"`).

Required CI variables: File — `ENV_FILE`, `ENV_FILE_BACKEND`, `ENV_FILE_FRONTEND`, `ENV_FILE_QUEUE`, `ENV_FILE_NEXT_PUBLIC_TEMPLATE`, `GLOBAL_ENV_FILE`; masked/plain — `CNPG_SUPERUSER_PASSWORD`, `NEXT_PUBLIC_GOOGLE_API`, `API`, `AUTO_DEVOPS_WEB_DOMAIN`, `KUBE_NAMESPACE`, `INDEXER_TAG`, `INDEXER_SHA`, `DEPLOY_WEBSITE`.

**Gap (CI-1)**: **no job runs lint, type-check, or tests — on merge requests or anywhere.** The `test` stage is empty; the Cypress job is commented out. Given the constitution mandates TDD, this is a contradiction that must be closed: a `test` job running backend Jest, queue-backend Jest, frontend Jest, `helm lint`, and `tsc --noEmit` should run on every merge request.

**Gap (CI-2)**: nothing keys off `dev`, although `dev` is the default branch and receives all feature merges. `DEPLOY_CARDANO_DBSYNC` is declared but consumed by no job.

**Gap (CI-3)**: `.github/` contains issue and PR templates only — no workflows — and they still reference the upstream `IntersectMBO/xxxx` placeholder repo and a non-existent `CODEOWNERS`.

### 9.4 Local development

`docker-compose.yaml`, network `io-1694`:

| Service | Image / build | Port |
|---|---|---|
| `frontend` | `frontend/Dockerfile.dev` | 3000 |
| `backend` | `backend/Dockerfile.dev` | 8000 |
| `queue-backend` | `queue-backend/Dockerfile.dev` | 9999 |
| `web_db` (`voltaire_db`) | `postgres:17.1-bookworm` | 5432 |
| `1694-redis` | `redis:7.2-alpine` | 6379 |
| `governance-indexer` | prebuilt image | — |
| `adminer` | `adminer` | 8080 |

Local database `1694`, user `voltaire`. Healthchecks gate startup: backend waits for a healthy database, queue-backend for healthy Redis plus a started backend.

Makefile groups: lifecycle (`up`, `down`, `restart`, `status`, `rm`, `watch`, `build`), install (`backend-install`, `queue-backend-install`, `frontend-install`), shells, migrations (`migrate`, `migrate-revert`, `generate-migration MIGRATION_NAME=…`), tests (`test-backend`, `test-backend-e2e`), logs, images, indexer control, sync jobs (§5.3), and destructive DB targets (`clean-db-and-sync`, `db-clean-governance`, both truncating the five governance tables behind a short abort window; `db-stats`).

**Gap (DOC-1)**: `README.md` states ports 8080 (backend), 4000 (frontend), 5434 (database) and a GitHub clone URL — all stale and contradicted by the compose file and the actual GitLab remote. **Gap (DOC-2)**: `make sh-cardano` and `make governance-db-shell` target compose services that no longer exist; `.PHONY test-backend-e2e` is missing its colon.

### 9.5 Observability

- Probes: backend has real HTTP `/healthz/live` and `/healthz/ready`; frontend and queue use `tcpSocket` only; the indexer has **no probes**. No startup probes anywhere.
- Metrics: only the Redis exporter sidecar and the CNPG Pooler PodMonitor. No ServiceMonitor for the apps, no CNPG cluster-level monitoring block, no Prometheus/Grafana manifests in-repo.
- Logging: stdout only, Nest `Logger` per class in the workers and Blockfrost/IPFS services, mixed with raw `console.error` in several backend services. No structured logger, no request logging, no correlation ids.
- No tracing, no error tracking. Sentry is a frontend dependency with no config and zero imports; `withSentryConfig` is commented out; `global-error.jsx` has an empty `useEffect` marked `//@todo`.

**Gap (OBS-1)**: required minimum — real readiness probes on frontend and queue, liveness on the indexer, a structured logger with correlation ids in both Nest apps, and error tracking wired to something. Each needs its own spec.

---

## 10. Feature Specifications (folded from prior specs)

The four superseded specs are preserved here with their acceptance criteria intact.

### 10.1 Delegation transfer (undelegation) events — *Ready for Dev*

**Intent**: as a DRep, see an event on the timeline when a delegator leaves for another DRep, so the historical log of delegators is accurate.

The chain emits only a single `VoteDelegation` certificate carrying the *new* DRep id — there is no undelegation certificate. The platform therefore synthesizes one.

**Required**

1. The Rust indexer stays stateless: it extracts the raw `delegation` event and inserts it against the new DRep, with no state lookup. `resolve_previous_drep` and `DELEGATION_CACHE` are removed; `previous_drep` and `stake_address` may be left null.
2. `TimelineWatcherWorker` processes new `delegation` events.
3. Before triggering the full sync, the worker checks `drep_delegators` for a prior delegation of that `stake_address` to a *different* DRep.
4. If one exists, the worker synthesizes an `undelegation` event into `drep_timeline_event` for the *previous* DRep.
5. The synthesized event shares `tx_hash`, `epoch` and `slot` with the delegation event, and uses a distinct `tx_index` (offset, e.g. `tx_index + 1000`) or a widened unique constraint `(tx_hash, tx_index, event_type)` to avoid a unique-constraint violation.
6. `DrepTimelineEvent.eventType` includes `'undelegation'`.

**Edge cases**: first-ever delegation produces no undelegation event; re-delegation to the same DRep produces none; rollbacks delete the synthesized event automatically because it shares the source event's slot.

**Test cases**
- [ ] A stake key with no prior delegation produces zero extra events.
- [ ] A stake key delegated to DRep A, re-delegating to DRep B, produces exactly one `undelegation` event for DRep A.
- [ ] The synthesized event violates no unique constraint and carries the correct slot and timestamp.

### 10.2 CNPG database migration — *In Progress*

**Intent**: as an operator, move Postgres off the deprecated Bitnami `postgresql-ha` chart to CloudNativePG, for upstream patches and native Kubernetes failover.

**Required**

1. Cluster, Database and superuser Secret are templates inside the `www-1694` chart — no separate Helm release.
2. The whole block is gated by `.Values.cnpg.enabled`.
3. Two instances (primary + replica), PostgreSQL 17.5, longhorn storage.
4. A PgBouncer `Pooler` (2 instances, transaction mode) fronts the cluster as `www-1694-cnpg-pooler`; apps connect only through it.
5. WAL archiving and S3 backups are deferred — no ObjectStore, ScheduledBackup or Barman blocks. *(Tracked as INFRA-4; this deferral must now be reversed.)*
6. A one-shot migration Job (`cnpg.migration.enabled`) runs `pg_dump | pg_restore` entirely inside the cluster network; `backoffLimit 3`, `ttlSecondsAfterFinished 86400` on success only.
7. The indexer's `DATABASE_URL` comes from a `secretKeyRef`, never from a values file.
8. The Bitnami release and `chart/values.postgresql.yaml` are left untouched until the cutover is verified.
9. CI populates `chart/global_env` from `$GLOBAL_ENV_FILE` before every `helm upgrade`.
10. `cnpg.superuserPassword` and `cnpg.migration.sourcePassword` default to empty and are supplied by masked CI variables.

**Cutover runbook (operator, in order)**

1. Deploy with `cnpg.enabled: true` and `cnpg.migration.enabled: false`; the cluster bootstraps empty.
2. Retrieve the generated `voltaire` password:
   ```bash
   kubectl get secret www-1694-cnpg-cluster-app -n voltaire-mainnet \
     -o jsonpath='{.data.password}' | base64 -d
   ```
3. Update the `GLOBAL_ENV_FILE` CI variable so `DATABASE_URL` points at `www-1694-cnpg-pooler`.
4. Set `cnpg.migration.enabled: true` and `cnpg.migration.sourcePassword=$POSTGRESQL_WEB_PASSWORD`; the migration Job runs.
5. Verify data integrity, then set `cnpg.migration.enabled: false` and remove the Bitnami release.

**Test cases**
- [ ] `helm lint chart/` passes with zero errors.
- [ ] `helm template chart/ --set cnpg.enabled=false` renders zero CNPG resources.
- [ ] `--set cnpg.superuserPassword=x` renders a `kubernetes.io/basic-auth` Secret `www-1694-cnpg-superuser` with username `postgres`.
- [ ] `--set cnpg.migration.enabled=false` renders zero Jobs.
- [ ] `--set cnpg.migration.enabled=true …` renders exactly one Job `www-1694-cnpg-migration-job`.
- [ ] The indexer Deployment uses `secretKeyRef` for `DATABASE_URL` with no plain `value:`.

**Remaining**: operator cutover steps 2–5, then INFRA-4 (backups).

### 10.3 Redis operator migration — *Ready for Dev*

**Intent**: as an operator, replace the deprecated Bitnami Redis chart with the OpsTree Redis Operator, so Redis is a CRD like CNPG and cannot be redeployed by a stale CI job.

**Required**

1. `chart/templates/redis.cluster.yaml` uses `redis.redis.opstreelabs.in/v1beta2` kind `Redis`.
2. The operator is already installed cluster-wide; no operator install here.
3. Gated by `.Values.redis.enabled`.
4. The password comes from `www-1694-global-secrets` key `REDIS_PASSWORD`. **Not yet implemented — INFRA-5.**
5. Storage: 5Gi longhorn.
6. Resources: requests 128Mi/100m, limits 1Gi/500m.
7. Image `quay.io/opstree/redis:v8.4.0`.
8. Standalone: `clusterSize 1`, `clusterMode: Standalone`, 0 followers.
9. Redis exporter sidecar enabled.
10. The Bitnami `redis_preview` CI job and its YAML anchor are removed.
11. `values.yaml` carries a structured `redis` block, not a bare image string.
12. Service name changes from `redis-master:6379` to `www-1694-redis-cluster:6379`; `REDIS_HOST` in `ENV_FILE_BACKEND` and `ENV_FILE_QUEUE` must be updated.

Config: `maxmemory-policy allkeys-lru`, `appendonly yes` / `appendfsync no`, RDB snapshots disabled.

**Edge cases**: if no pod appears, check the operator's `WATCH_NAMESPACE`/cluster-role covers the namespace; the leftover Bitnami `redis-master-0` PVC holds only ephemeral cache and can be deleted after the operator Redis is healthy; a missing `REDIS_PASSWORD` key prevents startup.

**Test cases**
- [ ] `--set redis.enabled=false` renders zero `Redis` resources.
- [ ] `--set redis.enabled=true` renders exactly one `Redis` named `www-1694-redis-cluster` in the right namespace.
- [ ] The rendered resource references `www-1694-global-secrets` key `REDIS_PASSWORD`.
- [ ] `clusterMode: Standalone` and `redisFollower.replicas: 0`.
- [ ] Storage is 5Gi with `storageClassName: longhorn`.

### 10.4 Governance action card enrichment — *Implemented*

**Intent**: as a DRep or delegator browsing governance actions, see voting thresholds, vote counts, ratification period and expiry directly on the cards, to judge viability and urgency at a glance.

**Thresholds** — derived from current protocol parameters, displayed as percentages (`0.51` → `51%`), fetched once per session from `GET /dreps/epochs/latest/parameters` via `useEpochParamsQuery` (staleTime 5 days).

| Governance type | DRep threshold | SPO threshold |
|---|---|---|
| `no_confidence` | `dvt_motion_no_confidence` | `pvt_motion_no_confidence` |
| `new_committee` | `dvt_committee_normal` | `pvt_committee_normal` |
| `new_constitution` | `dvt_update_to_constitution` | — |
| `hard_fork_initiation` | `dvt_hard_fork_initiation` | `pvt_hard_fork_initiation` |
| `parameter_change` | minimum of the group-specific `dvt_p_p_*` values, labelled "DRep (varies by group)" | — |
| `treasury_withdrawals` | `dvt_treasury_withdrawal` | — |
| `info_action` | — | "No ratification threshold" note |

**Ratification period**: `gov_action_lifetime` shown as visible text "Active N epochs" (not tooltip-only); expiry as "Expires Ep. N"; voting start derived as `expiration_epoch − gov_action_lifetime`.

**Lifecycle badge** (`GovernanceLifecycleBadge`), priority enacted > ratified > expired > dropped > active:

| Condition | Label | Token |
|---|---|---|
| `enacted_epoch` set | Enacted | `bg-primary-300 text-white` |
| `ratified_epoch` set | Ratified | `bg-complementary-300 text-white` |
| `expired_epoch` set | Expired | `bg-extra_red text-white` |
| `dropped_epoch` set | Dropped | `bg-gray-800 text-white` |
| none | Active | `bg-success text-zinc-800` |

**Vote counts** (`GovActionVoteCard` only): yes/no/abstain badges with percentages, a segmented progress bar (green/red/teal) with a threshold marker, and a "✓ Threshold met" indicator when yes% ≥ the DRep threshold.

**Content overlay** (`ProposalContentOverlay`): all abstract, rationale and vote-rationale text is removed from card bodies and read in an overlay — a bottom sheet at 92vh on mobile, a centred modal (max-width `sm`, max 80vh) on desktop. Sections: Abstract → Proposal Rationale → Vote Rationale (fetched from the external anchor via `useGetExternalMetadata`). Footer: copy hash plus GovTool / Cardanoscan links.

**Data flow.** Frontend `GovAction` type gains `governance_type`, `ratified_epoch`, `dropped_epoch`, `expired_epoch`, `drep_yes_count`, `drep_no_count`, `drep_abstain_count`; shared helpers `getThresholdsForType` and `getLifecycleStatus` live in `src/lib/governanceThresholds.ts`. Backend `dRep.repository.ts#getDRepGovActionsVotes` returns the lifecycle epochs and governance type and LEFT JOINs an aggregate subquery:

```sql
LEFT JOIN (
  SELECT
    proposal_id,
    COUNT(*) FILTER (WHERE LOWER(vote) = 'yes')     AS drep_yes_count,
    COUNT(*) FILTER (WHERE LOWER(vote) = 'no')      AS drep_no_count,
    COUNT(*) FILTER (WHERE LOWER(vote) = 'abstain') AS drep_abstain_count
  FROM proposal_votes
  WHERE LOWER(voter_role) = 'drep'
  GROUP BY proposal_id
) vc ON p.id = vc.proposal_id
```

`proposals.service.ts#getProposalById` returns full lifecycle epochs plus a vote breakdown by role.

**Constraints**: no new colour tokens; mobile-first with wrapping rows; no inline body content on cards; descriptions matching `/^(https?:\/\/\S+|proposal\s+as\s+pdf\s*:)/i` are suppressed everywhere.

**Edge cases**: a failed params fetch omits the threshold row silently; a null `expirationEpoch` omits the expiry row; an unknown governance type renders no threshold but shows the raw type chip; zero total votes renders no `VoteBar`; an empty overlay shows "No proposal content available."; a failed external rationale shows "Could not load external rationale." without propagating an error.

**Test cases**: all unit, component and integration cases from the original spec are implemented and passing — thresholds per type, lifecycle priority, badge rendering, meta-row text, both timeline-card modes, the vote card, `useEpochParamsQuery` stale-window behaviour, and the backend vote-count subquery.

---

## 11. Cross-cutting Requirements

### 11.1 Testing

Current state: 5 test files across the two Nest apps (`backend/src/governance/governance.service.spec.ts`, `backend/test/app.e2e-spec.ts`, `backend/test/drep-claim.e2e-spec.ts`, `queue-backend/src/workers/timeline-watcher.worker.spec.ts`, `queue-backend/test/app.e2e-spec.ts`), 2 in the frontend (`homepage.test.js`, `exampleUtil.test.js`), and 4 Cypress specs. None run in CI.

**Required**

1. Every new feature follows the constitution's TDD loop: failing tests written from the spec's test cases first, proven to fail, then minimal implementation.
2. A `test` CI job runs on every merge request: backend Jest, queue-backend Jest, frontend Jest, `helm lint chart/`, and `tsc --noEmit` for all three apps.
3. Infrastructure changes are tested with `helm template` assertions, as in §10.2 and §10.3.
4. `queue-backend/test/app.e2e-spec.ts` asserts `GET /` returns "Hello World!" but `AppController` is not registered in `AppModule.controllers` — fix the test or register the controller.

### 11.2 TypeScript strictness

`strictNullChecks`, `noImplicitAny`, `strictBindCallApply` and `noFallthroughCasesInSwitch` are off in the backend; the frontend has `"strict": false`; the frontend also sets `eslint.ignoreDuringBuilds: true`.

**Required**: strictness is raised incrementally, package by package, each step under its own spec. New code should not depend on the loose settings.

### 11.3 Logging and errors

**Required**

1. Use Nest's `Logger`, never `console.*`, in either Nest app. Log sparsely: `log` for milestones, `warn` for non-critical, `error` for failures. No logging inside tight loops.
2. No global exception filter exists today; adding one is required work (OBS-1) so that upstream status codes and error shapes are consistent.
3. Never leak credentials, tokens, or full metadata blobs into logs.

### 11.4 Caching

Redis is the BullMQ broker only. The only application cache is in-process: `GovernanceService.currentEpochCached` with a 1-hour TTL, plus derived epoch arithmetic from `EPOCH_ANCHOR_MS` and `EPOCH_DURATION_MS = 432000000`.

**Required**: introducing a read-through cache is a specced change, not an incidental one.

---

## 12. Technical Debt Register

Carried here so it is visible in one place. Each item needs its own feature spec before work starts.

| Id | Item | Impact |
|---|---|---|
| INFRA-4 | No Postgres backups or WAL archiving | **Critical** — no point-in-time recovery in production |
| CI-1 | No lint/type-check/test job anywhere in CI | High — contradicts the mandated TDD workflow |
| SEC-1..SEC-5 | Unguarded comment writes, inert validation, open `/sync-trigger` and `/queues`, committed credentials, open CORS | High |
| DEBT-1 | `blockfrost.service.ts`, the six governance entities, `queue.constants.ts` and `queue.types.ts` are maintained twice and have already drifted (retry, `getIpfsContent`, `assertGovernanceSourceFresh`, `TIMELINE_WATCHER`, `syncOnly` exist only in the queue-backend copies) | High — a shared package is the fix |
| DEBT-2 | `syncProposals()` and the metadata/gateway/anchor helpers are copy-pasted between `governance-sync.worker.ts` and `proposals-sync.worker.ts`, with one behavioural difference in the metadata target query | Medium |
| DEBT-3 | Dead code: all 24 files in `backend/src/queries/`, `queue-backend/src/queries/getDrepRegistrationData.ts`, `queue-backend/src/governance/governance.service.ts` (317 lines, injected nowhere), `queue-backend/src/entities/drep-delegator.entity.ts`, `queue-backend/src/app.controller.ts`, `backend/src/repository/cardano/cardano.repository.ts`, and ~11 unreferenced service methods | Medium — misleads readers and agents |
| DEBT-4 | `includeRetired` is commented out in both governance services, so the query parameter silently does nothing | Medium — a user-visible filter that does not filter |
| DEBT-5 | Duplicate route handlers: `POST /auth/login/verify-sigs` and `/auth/login/link-sigs-to-drep` call the identical function with the same argument | Low |
| REL-1, REL-2 | Backend Blockfrost lacks retry; workers swallow failures by returning instead of throwing | Medium |
| PERF-1, PERF-2 | In-memory DRep list pagination; `pageSize=10000` parallel proposal query | Medium |
| I18N-1 | i18n scaffolding with empty bundles, zero usage, duplicate configs, naive middleware prefix match | Medium |
| FE-1, FE-2 | No SSR metadata for profile/proposal pages; token store mismatch | Medium |
| OBS-1 | No real probes on frontend/queue/indexer, no app metrics, no structured logging, no error tracking | Medium |
| CFG-1 | `NEXT_PUBLIC_BASE_URL_ADASTAT` missing from `.env.example`; `uuid` imported but undeclared; `METRICS_BASE_URL`, `CARDANO_EPOCH_ANCHOR_MS`, `IPFS_KUBO_*` missing from `backend/.env.example`; queue-backend `.env.example` omits the Blockfrost vars its workers require | Medium — a fresh clone cannot be configured from the examples |
| INFRA-1..3, 5, 6 | Hardcoded resources, suspicious TLS host quoting, dead values blocks, Redis without auth, orphaned Bitnami values | Medium |
| DOC-1, DOC-2, CI-3 | Stale README ports and clone URL, dead Makefile targets, upstream-boilerplate `CONTRIBUTING.md`/`.github/` referencing `IntersectMBO/xxxx` and a non-existent `CODEOWNERS` | Low but constant friction |

---

## 13. Working Conventions

### 13.1 Spec-driven development

Per `.claude/docs/project-constitution.md`, the loop is: read the spec → write failing tests from its test cases → prove they fail → implement the minimum → verify against the spec → update `.claude/docs/roadmap.md`. Never guess a missing requirement; stop and ask.

**How this document is used**

- This file is the standing description of the system: architecture, contracts, invariants, and known gaps.
- A new feature still gets its own numbered spec from `template.md` (`05-…`, `06-…`). Those specs are narrow and time-bound.
- When a feature ships, fold its durable rules into the relevant section here and retire the numbered spec.
- Anything in §12 needs a numbered spec before implementation.

### 13.2 Branching and commits

Actual branches: `dev` (default, receives feature merges) and `main` (production deploys). `CONTRIBUTING.md` still documents a `develop` → `test` → `staging` → `main` flow with `beta` deploys that does not exist — treat that document as out of date until it is rewritten.

Conventions that do hold: branch names prefixed `feat/`, `fix/`, `chore/`, `docs/` plus the issue number (`feat/123-short-description`); commit subjects ≤50 characters, capitalised, imperative, no trailing period, body wrapped at 72 explaining what and why; rebase feature branches rather than merging the base branch into them; delete branches after merge; bump the `UNRELEASED` entry in `CHANGELOG.md`.

### 13.3 Maintainers

Lead maintainer Darlington Wleh; core maintainer Emmanuel Mutisya; DevOps primary Darlington Kofa. Minor decisions by any maintainer, major by two core maintainers, architecture by the lead maintainer (`MAINTAINERS.md`).

### 13.4 Code style

From `CLAUDE.md`, and binding on agents and humans alike: sparse meaningful logs, no obvious or step-numbered comments, consistent formatting, modern TypeScript over boilerplate, and no placeholder or TODO stubs left behind unless explicitly requested.

---

## 14. Change Log for this Document

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-08-14 | Initial consolidation. Full codebase scan at `859cdc7e`; supersedes specs 01–04, which are folded into §10 with status preserved. Adds §12 debt register from the scan. |
