# Environment-independent image builds

Source: failed main pipelines 35228/35256 at 4eedbc5f. Goal: make the reviewed
application deployable from main to production through the existing manual jobs.
Changes target dev first under CONTRIBUTING.md; promotion/merge/deployment and
runner infrastructure changes are outside this fix MR's authority.

- R1: Backend and queue image build jobs run without ENV_FILE, ENV_FILE_BACKEND,
  ENV_FILE_QUEUE, ENV_FILE_FRONTEND or GLOBAL_ENV_FILE. Do not widen environment
  scopes or inject production credentials into builds. Exclude backend/queue
  dotenv files and chart env inputs from Docker build contexts.
- R2: Full preview and production deployment jobs retain filtered environment
  assembly, gateway/IPFS preflights, environment scopes and manual gates.
  Frontend builds retain the environment-independent public placeholder template.
- R3: Offline normal/preserved Secret tests pin their release namespace, remain
  deterministic with a non-default inherited Helm namespace and still execute
  real ownership validation and fallback-key filtering. Never loosen the chart
  ownership guard to make a fixture pass.
- R4: Only the production frontend image's dependency stage skips downloading
  the unused Cypress desktop binary. Retain dependency lifecycle scripts,
  lockfile enforcement and normal Cypress behavior outside that image stage.
- R5: Regression checks run in the existing automatic offline CI job. No manual
  jobs, secret variables, production replicas, image-pull policies, checksums,
  runner configuration or project protections are changed by this MR.

Tests exercise both backend build job scripts using a dummy Docker executable
and no runtime file variables; inspect the context exclusion/security contract;
retain deployment preflights/assembly checks; render both chart modes with an
inherited non-default namespace; and verify frontend dependency stage settings.
Docker build availability and remote runner failures must be reported, not
inferred from local package/test results. A full production rollout remains a
separate authorized operation after review, merge/promotion and image builds.
