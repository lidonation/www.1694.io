# Contabo IPFS migration (#244)

Source: work item #244 and infrastructure `wiki/runbooks/ipfs-contabo-restore.md`
(2026-11-13). Target: `dev`. The referenced `.claude/docs` constitution and
spec template are absent; current specifications live in `docs/specs`.

- R1: JSON and streamed reads use IPFS_GATEWAY_URL independently of cluster
  credentials, then Blockfrost primary/fallback. Accept IPFS_KUBO_GATEWAY_URL
  only as a local migration alias. Deployments reject both obsolete Kubo keys.
- R2: Upload a single attachment as multipart to authenticated POST /add with
  stream-channels=false, progress=false and replication-min/max=-1. Normalize
  cluster's lowercase cid/name/size response into the existing IPFSResponse.
  Preserve bytes and filenames, and keep primary/fallback Blockfrost uploads.
- R3: Use authenticated POST /pins/{cid}, GET /pins/{cid} and DELETE /pins/{cid}
  for pin, global status and unpin. Accepted asynchronous pins return queued;
  status is pinned only when all reported peers are pinned. Keep Blockfrost
  fallbacks. Never use Kubo RPC, including status/unpin.
- R4: Cluster URL/user/password must be configured together; absent cluster
  configuration permits gateway-only/Blockfrost use. Credentials go only to the
  cluster, not gateways, redirects, Blockfrost, logs or client error responses.
  Requests have bounded timeouts. Keep public service signatures unchanged.
- R5: CI and Helm reject obsolete IPFS_KUBO_API_URL and IPFS_KUBO_GATEWAY_URL
  from deployment env files; preserved Secrets discard them. Keep canonical
  cluster keys centralized in the backend Secret loaded by backend and queue.
- R6: Document rollout prerequisites for preview and production: dedicated
  voltaire vault credential, environment-scoped settings, credential rotation,
  full deployment, three-peer status and public CID fetch. Live infrastructure
  mutations and preview smoke verification require an operator and are not
  performed by this implementation run.

Tests: backend service contract fixtures (including real HTTP multipart transport),
CI shell fixtures and offline Helm renders. Deployment completion requires a
preview upload, PINNED on all three peers and byte-identical public fetch.
