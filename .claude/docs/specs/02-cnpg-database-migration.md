# Feature Spec: CNPG Database Migration

**Status**: In Progress
**Target Component**: Infrastructure / Helm Chart

## 1. User Intent
- **As an** operator
- **I want to** migrate the PostgreSQL database from the deprecated Bitnami postgresql-ha Helm chart to CloudNativePG (CNPG)
- **So that** the database stack receives upstream security patches and gains native Kubernetes failover

## 2. Functional Requirements
1. The CNPG Cluster, Database, and superuser Secret are defined as Helm templates inside the `www-1694` chart — no separate Helm release required.
2. The entire CNPG block is gated by `.Values.cnpg.enabled` so it can be toggled without deleting template files.
3. The cluster runs 2 instances (1 primary + 1 replica) on PostgreSQL 17.5 with Longhorn storage.
4. A PgBouncer Pooler (2 instances, transaction mode) fronts the cluster and exposes the service `www-1694-cnpg-pooler` for app connections.
5. WAL archiving and S3 backups are deferred — no ObjectStore, ScheduledBackup, or Barman plugin blocks are configured at this time.
6. A one-shot migration Job (`cnpg.migration.enabled: true`) runs `pg_dump | pg_restore` entirely inside the cluster network to copy data from the Bitnami source to the CNPG target.
7. The `governance-indexer` `DATABASE_URL` is sourced from a `secretKeyRef` against `www-1694-global-secrets` key `DATABASE_URL` — it is never stored in values files.
8. The Bitnami `postgresql` release and its `chart/values.postgresql.yaml` are left untouched and run in parallel until migration is verified and the release is manually removed.
9. GitLab CI populates `chart/global_env` from the `$GLOBAL_ENV_FILE` CI File variable before every `helm upgrade`, ensuring `www-1694-global-secrets` always contains the current `DATABASE_URL`.
10. All secret values (`cnpg.superuserPassword`, `cnpg.migration.sourcePassword`) have empty defaults in `values.yaml` and must be supplied at deploy time via GitLab CI masked variables — never committed.

## 3. Edge Cases & Error Handling
- **Bitnami still running**: Both stacks coexist. Apps continue to talk to the Bitnami pooler until the operator explicitly cuts over the `DATABASE_URL` in `GLOBAL_ENV_FILE` and re-deploys.
- **Migration Job failure**: `backoffLimit: 3` retries. The Job never auto-deletes on failure (`ttlSecondsAfterFinished: 86400` only applies on success). The operator can inspect logs before re-running.
- **Empty `global_env`**: If `GLOBAL_ENV_FILE` is not set in CI, `www-1694-global-secrets` will be empty and the governance-indexer pod will fail to start. CI must have `GLOBAL_ENV_FILE` defined before deploying.
- **Superuser password not set**: `cnpg.superuserPassword` defaults to `""`. If not supplied at deploy time, the cluster will bootstrap with an empty password — the CI pipeline must always pass `$CNPG_SUPERUSER_PASSWORD`.
- **Production vs preview databases**: `values.yaml` defaults to database `1694` (preview). `values.prod.yaml` overrides to `1694_mainnet` with 200Gi storage. The production CI job loads both files.

## 4. Technical Design

### Files Created
- `chart/templates/cnpg.cluster.yaml` — Secret (superuser), Cluster, Database, ScheduledBackup, ObjectStore
- `chart/templates/cnpg.pooler.yaml` — PgBouncer Pooler
- `chart/templates/cnpg.migration-job.yaml` — one-shot migration Job

### Files Modified
- `chart/values.yaml` — added `cnpg:` block; `governanceIndexer.databaseUrl` marked as unused
- `chart/values.prod.yaml` — production `cnpg:` overrides (database, storage size); `governanceIndexer.databaseUrl` marked as unused
- `chart/templates/deployment.governance-indexer.yaml` — `DATABASE_URL` changed from `value:` to `secretKeyRef: www-1694-global-secrets.DATABASE_URL`
- `.gitlab-ci.yml` — added `cp $GLOBAL_ENV_FILE ./chart/global_env`; replaced `--set governanceIndexer.databaseUrl` with `--set cnpg.superuserPassword`; production job now loads `-f ./chart/values.prod.yaml`

### Cluster Resource Limits (conservative — not lidonation)
| Resource | Request | Limit |
|---|---|---|
| PostgreSQL pod | 512Mi / 250m | 8Gi / 4 CPU |
| PgBouncer pod | 128Mi / 50m | 512Mi / 500m |
| Migration Job | 512Mi / 250m | 2Gi / 1 CPU |

### PostgreSQL Parameters
```
max_connections: 200       shared_buffers: 256MB
effective_cache_size: 2GB  work_mem: 16MB
maintenance_work_mem: 256MB  wal_buffers: 16MB
log_min_duration_statement: 2000  log_statement: none
```

### GitLab CI Variables Required
| Variable | Type | Purpose |
|---|---|---|
| `CNPG_SUPERUSER_PASSWORD` | Variable (masked) | CNPG postgres superuser password |
| `GLOBAL_ENV_FILE` | File | Contains `DATABASE_URL` |

## 5. Cutover Runbook (operator steps)

1. Deploy with `cnpg.enabled: true`, `cnpg.migration.enabled: false` → cluster bootstraps empty.
2. Retrieve the CNPG-generated `voltaire` user password:
   ```bash
   kubectl get secret www-1694-cnpg-cluster-app -n voltaire-mainnet \
     -o jsonpath='{.data.password}' | base64 -d
   ```
3. Update `GLOBAL_ENV_FILE` CI variable with new `DATABASE_URL` pointing at `www-1694-cnpg-pooler`.
4. Flip `cnpg.migration.enabled: true`, set `cnpg.migration.sourcePassword=$POSTGRESQL_WEB_PASSWORD` → migration Job runs.
5. Verify data integrity. Then flip `cnpg.migration.enabled: false` and remove the Bitnami release.

## 6. Required Test Cases (TDD)
- [ ] Test 1: `helm lint chart/` passes with zero errors.
- [ ] Test 2: `helm template chart/ --set cnpg.enabled=false` renders zero CNPG resources (Cluster, Database, Pooler, ObjectStore, ScheduledBackup, Job).
- [ ] Test 3: `helm template chart/ --set cnpg.superuserPassword=x` renders a Secret of type `kubernetes.io/basic-auth` named `www-1694-cnpg-superuser` with username `postgres`.
- [ ] Test 4: `helm template chart/ --set cnpg.migration.enabled=false` renders zero Jobs.
- [ ] Test 5: `helm template chart/ --set cnpg.migration.enabled=true --set cnpg.migration.sourcePassword=x --set cnpg.superuserPassword=x` renders exactly one Job named `www-1694-cnpg-migration-job`.
- [ ] Test 6: The governance-indexer Deployment template contains a `secretKeyRef` for `DATABASE_URL` pointing at `www-1694-global-secrets` — no plain `value:` field for that env var.
