# Internal Cardano API routing

## Scope and contract

Route the API backend and BullMQ indexer's existing on-chain requests through
infrastructure's Cardano API gateway. Use its Blockfrost-compatible `/api/v0`
interface, not native Koios response shapes. Public hosts are discovery URLs,
not deployment targets: public quotas make them unsuitable for indexing.

- **R1:** Both `BlockfrostService` clients select `CARDANO_API_URL` and
  `CARDANO_API_PROJECT_ID` as an inseparable primary pair when configured.
  Reject incomplete pairs and invalid HTTP(S) base URLs (credentials, queries
  and fragments are not allowed) at startup. Trim trailing slashes. Without either,
  retain legacy `BLOCKFROST_NETWORK_*` configuration for local development.
  Preserve endpoint paths, pagination, response shapes and transaction CBOR.
- **R2:** Preserve `BLOCKFROST_NETWORK_*_FALLBACK`, retry/not-found behavior,
  and the indexer's primary-versus-fallback epoch freshness check.
- **R3:** Helm explicitly supplies the preview internal gateway URL by default
  and mainnet via production values. Build the Service URL from a validated
  `cardanoApi.network` enum (preview/mainnet), never a public hostname.
  Both app containers read the gateway key
  from `CARDANO_API_PROJECT_ID` in the backend Secret, overriding env-file
  collisions. Reject unknown or missing networks during chart rendering.
  The frontend receives neither the key nor internal URL.
- **R4:** IPFS requests keep their separate Blockfrost IPFS configuration;
  never send the new gateway project ID to the external IPFS endpoint.
- **R5:** Document rollout prerequisites and the db-sync audit. This branch has
  no active direct db-sync connection: local governance/index tables remain the
  application's cache, populated by the workers. No schema migration or
  infrastructure deployment is part of this change.

## Test cases

Retained Jest coverage in each backend package proves primary selection with
both old and new configuration present, authenticated governance/UTXO/epoch/
transaction paths, fallback, invalid partial configuration and legacy mode.
Queue tests also prove freshness denial for lagging/invalid primaries and IPFS
credential separation. Helm tests render both networks, assert explicit URL and
Secret references in both pods, reject invalid network selections, and verify
frontend isolation. Tests use dummy credentials and never call live services.

## Operational constraints

Internal Services bypass the gateway's public quota only; Koios and hosted
Blockfrost upstream limits still apply. The gateway requires its own client
project ID, not a hosted Blockfrost ID. Infrastructure's runbook still carries
a compatibility/readiness warning: live compatibility must be smoke-tested by
an operator before rollout. Do not deploy, merge, trigger CI jobs or fetch
production secrets as part of this MR.
