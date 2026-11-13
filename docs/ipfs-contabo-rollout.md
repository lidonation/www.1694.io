# Contabo IPFS rollout (#244)

Code is prepared here; the following live operations require an authorized
operator. Do preview first. Do not expose Kubo RPC port 5001 or revive the
retired `lidolovelace-ipfs-cluster-service`.

## Prepare credentials and deployment inputs

1. In `2lovelaces/infrastructure`, follow
   [Restoring IPFS on Contabo](https://gitlab.2lovelaces.io/2lovelaces/infrastructure/-/blob/main/wiki/runbooks/ipfs-contabo-restore.md).
   Create/check the dedicated `voltaire` user, backed by vault key
   `ipfs_api_password_voltaire` in the **Contabo** vault. If absent, use:

   ```sh
   make ipfs-vault-api-password IPFS_API_USER=voltaire VAULT_FILE=inventory/contabo/group_vars/all/vault.yml
   ```

   Then apply `playbooks/deploy-ipfs.yml` through that project's approved
   deployment procedure. Do not use the shared administrator account for the app.
2. Set the four environment-scoped GitLab CI/CD inputs for **preview** and
   **production** (target namespaces `voltaire-preview` and `voltaire`):

   | Variable | Setting |
   | --- | --- |
   | `IPFS_CLUSTER_API_URL` | `http://ipfs.ipfs.svc.cluster.local:9094` |
   | `IPFS_CLUSTER_API_USER` | `voltaire` |
   | `IPFS_CLUSTER_API_PASSWORD` | Dedicated vault credential, masked |
   | `IPFS_GATEWAY_URL` | `http://ipfs.ipfs.svc.cluster.local:8080` |

   Gateway values are base URLs, without `/ipfs` or `/cid`. Chart inputs remain
   `ipfs.clusterApiUrl`, `ipfs.clusterApiUser`, `ipfs.clusterApiPassword` and
   `ipfs.gatewayUrl`. No secret belongs in committed values files or logs.
3. Remove `IPFS_KUBO_API_URL` **and** `IPFS_KUBO_GATEWAY_URL` from all deployment
   env file sources, including backend, queue and global files and CI variables.
   The deploy guard and normal Helm renders reject these keys; preserved-Secret
   renders discard them. The backend accepts the old gateway key only for local
   migration, with `IPFS_GATEWAY_URL` taking precedence. It never reads the old
   RPC key.
4. Rotate the exposed `BLOCKFROST_IPFS_PROJECT_ID` and
   `BLOCKFROST_IPFS_PROJECT_ID_FALLBACK` in their source configuration for both
   environments through the existing credential-management process. Verify the
   replacements, then revoke the exposed credentials. These are **IPFS** project
   IDs, independent of Cardano gateway keys. Do not paste their values into a
   terminal transcript, MR, issue or chat.

## Preview and production

- Merge through `dev` and promote through the normal maintainer workflow. The
  current full deployment jobs `app-preview` and `production` are manual and
  consume `main`; they were not run by this change. Indexer-only deploy jobs
  do not deploy the backend code and are not a substitute for this rollout.
- Run the approved full preview deployment with normal env sources, not
  `preserveExistingAppEnv`. This writes the four canonical IPFS keys once into
  `www-1694-backend-secrets`, loaded by both backend and queue deployments.
  Check the queue and global Secrets cannot shadow them. Confirm both workloads
  rolled, not just that the Secret changed; envFrom values require new pods.
- Confirm presence and equality of effective settings without printing the
  password/project IDs. The IPFS NetworkPolicy must admit both application
  namespaces to TCP 9094 and 8080; the infrastructure runbook records this as
  already configured.
- Upload a small attachment via the preview UI/API as an authorized application
  user. Keep the returned CID and source bytes. `queued` means accepted, not
  completed replication; cluster add pins automatically. Explicit pins use
  POST `/pins/<cid>` with replication minimum/maximum `-1` (all peers).
- Using the authenticated `ctl` helper from `helm_repo/ipfs/README.md`, run
  `ctl status <cid>` (the helper invokes `ipfs-cluster-ctl status`). Require
  **three distinct peers**, each **PINNED**, and no error/offline peer. Save only
  nonsecret evidence: CID, timestamp, peer count/status and upload/fetch results.
- Fetch `https://ipfs.2lovelaces.com/cid/<cid>` and compare its bytes/hash with
  the uploaded file. Check an existing metadata CID and attachment download
  still work. The in-cluster gateway path is `/ipfs/<cid>`; public links use
  `/cid/<cid>`.
- Verify Blockfrost failover with an isolated preview test configuration, never
  by disrupting the shared IPFS service. Local HTTP fixtures already cover
  authentication failures, service errors and redirects without real credentials.
- After preview evidence is accepted, perform the same authorized full production
  deployment and smoke checks. This MR alone does not complete live acceptance.

## Rollback

Prefer correcting credentials/endpoints or rolling back this application release
through the normal manual workflow. Do not restore the dead Kubo endpoint or
expose its unauthenticated RPC. Blockfrost fallback can keep serving during a
cluster outage; it is not evidence that content is replicated on our cluster.

## Local verification

From `backend`: `yarn test --maxWorkers=6`, `yarn build`, `yarn lint` and
`yarn prettier --check 'src/ipfs/*.ts'`.
From the root: run `ci/tests/check-ipfs-settings.test.sh`,
`ci/tests/chart-ipfs.test.sh`, `ci/tests/ci-config-ipfs.test.sh` with `sh`, plus
`python3 ci/tests/cardano-fallback.test.py` for preserved-Secret cleanup.
