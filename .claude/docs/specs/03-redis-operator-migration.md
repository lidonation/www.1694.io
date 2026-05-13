# Feature Spec: Redis Operator Migration

**Status**: Ready for Dev
**Target Component**: Infrastructure / Helm Chart

## 1. User Intent
- **As an** operator
- **I want to** replace the deprecated Bitnami Redis Helm chart with the OpsTree Redis Operator
- **So that** Redis is managed via a Kubernetes CRD (same pattern as CNPG), receives upstream image updates, and can no longer be accidentally redeployed via a stale CI job

## 2. Functional Requirements
1. Add `chart/templates/redis.cluster.yaml` using `redis.redis.opstreelabs.in/v1beta2` kind `Redis` — mirroring the lidonation pattern but sized down for this workload.
2. The OpsTree Redis Operator is already installed cluster-wide (running for lidonation) — no operator installation required.
3. The Redis resource is gated by `.Values.redis.enabled` so it can be toggled without deleting the file.
4. Redis password is sourced from `www-1694-global-secrets` key `REDIS_PASSWORD` — same secret used for `DATABASE_URL`.
5. Storage: 5Gi Longhorn PVC (vs 10Gi for lidonation — smaller workload).
6. Resources sized conservatively: requests 128Mi/100m, limits 1Gi/500m CPU.
7. Image: `quay.io/opstree/redis:v8.4.0` (same as lidonation, no Bitnami).
8. Standalone mode, 0 followers (clusterSize: 1, clusterMode: Standalone).
9. Redis Exporter sidecar enabled for monitoring (same image as lidonation).
10. The `redis_preview` CI job (Bitnami) is removed from `.gitlab-ci.yml` — the operator manages Redis lifecycle, no Helm deploy job needed.
11. The `redis:` section in `values.yaml` is updated — replace `image: redis:7.2-rc2-alpine` with structured `enabled`, `storage.size`, `password` fields.
12. The Bitnami Redis service was named `redis-master`. The operator exposes the service as `www-1694-redis-cluster`. Apps connecting via `REDIS_HOST=redis-master` in their env files must be updated to `REDIS_HOST=www-1694-redis-cluster`.

## 3. Edge Cases & Error Handling
- **Operator not watching namespace**: The OpsTree operator is installed cluster-wide. If the `Redis` CRD is applied and no pod appears, verify the operator's `WATCH_NAMESPACE` env var or cluster-role binding includes `voltaire-preview`.
- **Existing Bitnami Redis PVC**: The Bitnami `redis-master-0` PVC may still exist after the Bitnami release is deleted. It contains no persistent data worth migrating (cache is ephemeral). Delete it manually after confirming the operator Redis is healthy.
- **Password rotation**: `REDIS_PASSWORD` in `www-1694-global-secrets` is populated from `GLOBAL_ENV_FILE`. If the key is absent, the Redis pod will fail to start. Ensure `REDIS_PASSWORD` is added to `GLOBAL_ENV_FILE` before deploying.

## 4. Technical Design

### Files Created
- `chart/templates/redis.cluster.yaml` — OpsTree `Redis` CRD resource

### Files Modified
- `chart/values.yaml` — replace `redis.image` with structured redis block
- `.gitlab-ci.yml` — remove `redis_preview` job and `redis` YAML anchor

### Resource Sizing (conservative vs lidonation)
| | Request | Limit |
|---|---|---|
| Redis | 128Mi / 100m | 1Gi / 500m |
| Exporter | 25m / 32Mi | 100m / 64Mi |

### Redis Config
- `maxmemory-policy: allkeys-lru`
- `appendonly: yes` / `appendfsync: no`
- RDB snapshots disabled (`save: ""`)
- No cluster mode config (standalone only)

### Service Name Change
| Before | After |
|---|---|
| `redis-master:6379` | `www-1694-redis-cluster:6379` |

Update `REDIS_HOST` (or `REDIS_URL`) in `ENV_FILE_BACKEND` and `ENV_FILE_QUEUE` GitLab CI variables.

## 5. Required Test Cases (TDD)
- [ ] Test 1: `helm template chart/ --set redis.enabled=false` renders zero `Redis` kind resources.
- [ ] Test 2: `helm template chart/ --set redis.enabled=true` renders exactly one `Redis` resource named `www-1694-redis-cluster` in the correct namespace.
- [ ] Test 3: The rendered `Redis` resource references `www-1694-global-secrets` key `REDIS_PASSWORD` for the redis secret.
- [ ] Test 4: The rendered `Redis` resource has `clusterMode: Standalone` and `redisFollower.replicas: 0`.
- [ ] Test 5: Storage is `5Gi` with `storageClassName: longhorn` by default.
