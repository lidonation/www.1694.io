# Gateway failure isolation (#234)

Supersedes specification 03's fallback requirement only in gateway mode.
Reconciled with the quota/resumability transport merged in !502: its metering,
cooldowns, sanitized errors and transaction single-dispatch contract take
precedence over this branch's original retry/error policy.

- R1: With the validated CARDANO_API pair present, never use legacy fallback
  settings for reads, CBOR submission or freshness probes, even if stale
  mainnet settings and independent scope names remain. Propagate the quota
  layer's final sanitized gateway error and status without changing its deferral
  reason/retry time. Retain at most two metered transient GET retries, immediate
  quota/throttle/authentication deferral and single-dispatch transaction POSTs.
- R2: Without the gateway pair, preserve legacy primary/fallback credentials,
  authoritative 404 handling and freshness comparison. Legacy failover remains
  GET-only and requires a verified independent scope under the quota policy.
- R3: In gateway mode compare the primary epoch with the same gateway's latest
  block epoch, never a direct provider. Deny missing/invalid primary epochs and
  epochs behind the comparison tip. Both probes must bypass staged replay.
  Propagate non-transient quota/budget/configuration deferrals; tolerate only a
  transiently unavailable comparison as before.
  This detects endpoint inconsistency, not a gateway whose entire index is stale;
  upstream freshness and network routing remain gateway responsibilities.
- R4: Remove both obsolete fallback keys from all chart-rendered application
  Secrets, including preserved release Secrets and env files. Helm deployments
  always select gateway mode. Keep every other key, especially gateway credentials.
  Build images without runtime env files; filter deploy inputs before Helm.
  Do not print secret values. See ci-image-builds.md for the build boundary.
- R5: Document authorized preview source cleanup, full Helm deploy, rolling both
  workloads, effective configuration checks and mocked failures. Live mutations
  and manual deployment jobs are not authorized by the implementation workflow.

Tests: both service fixtures cover 402/429/5xx/transport exhaustion, GET/POST,
legacy success and fallback, URL validation and credentials. Queue tests cover
404, retries, gateway/legacy freshness. Offline Helm renders cover normal and
preserved Secret data with dummy values, no cluster or real quota consumption.
