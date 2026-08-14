# 1694.io Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

As a minor extension, we also keep a semantic version for the `UNRELEASED`
changes.

## [UNRELEASED]

### Added
-

### Fixed
-

### Changed
-

### Removed
-

## [v1.0.0](https://github.com/lidonation/www.1694.io/releases/tag/v1.0.0) 2026-08-14

First tagged release. The platform has been in production use ahead of this tag;
1.0.0 marks the point at which the repository, its licensing and its release
process are formalised, and establishes the baseline that subsequent semantic
versions are measured against.

### Added

- **DRep profiles.** Registration, claiming and verification of a DRep profile
  by wallet signature, CIP-119 metadata authoring and on-chain metadata anchor
  submission, and profile pages for both technical and non-technical DReps.
- **Delegator engagement.** Notes and comments with reactions and notifications,
  so DReps can publish rationale and delegators can respond.
- **Governance explorer.** Governance action and proposal browsing with search,
  filtering and sorting; per-proposal vote breakdowns including stake-weighted
  totals; and Constitutional Committee vote tracking alongside DRep votes.
- **DRep activity timeline.** Epoch-paginated timeline of a DRep's votes,
  delegations, undelegations and metadata updates, with delegation events
  bundled per epoch.
- **Voting power and stake tracking.** Per-epoch DRep stake tracking, total
  active DRep stake, a voting power calculator, and governance threshold
  resolution against current protocol parameters.
- **Backend API.** NestJS service exposing the DRep, proposal, note, comment,
  reaction, notification and metrics endpoints, with JWT sessions established by
  Cardano wallet signature verification.
- **Queue backend.** NestJS + BullMQ service running the governance, proposal,
  DRep-vote, stake and DRep-claim sync workers, with a Bull Board dashboard and
  manual sync triggers.
- **Governance indexer.** Rust indexer populating the governance schema that the
  API and queue services read.
- **Frontend.** Next.js application with internationalisation, wallet
  connection, Markdown authoring and the governance and DRep interfaces.
- **IPFS attachments.** Attachment pinning with a Kubo-first chain that falls
  back to primary and secondary Blockfrost IPFS gateways.
- **Deployment.** Helm chart covering all services, CloudNativePG Postgres and
  Redis, plus a Docker Compose stack for local development.
- **Project governance documentation.** `GOVERNANCE.md` describing roles,
  decision making, maintainer nomination and the release process; a real
  `SECURITY.md` with a private reporting channel and response targets; and a
  `SUPPORT.md` pointing at live channels.
- **Continuous integration.** GitHub Actions workflow running lint, tests with
  coverage and build for all three Node applications, a CycloneDX SBOM job, and
  CodeQL code scanning. Dependabot configured for all three applications and for
  the workflow actions themselves.

### Fixed

- **Empty DRep timeline on first load.** The timeline cursor was parsed with
  `Number('')`, which evaluates to `0` rather than `NaN`, so a request with no
  cursor was treated as a request anchored on epoch 0 and returned nothing. The
  first page is now anchored on the current epoch. Regression tests cover an
  absent cursor, an empty cursor and a legacy millisecond-timestamp cursor.
- **Fuzzy DRep search** is now typo tolerant, and a broken link on the DRep list
  has been corrected.
- **Sync worker robustness.** Sync logic now preserves existing block times and
  skips only records in terminal states; BullMQ lock durations were increased to
  stop long-running sync jobs from expiring prematurely.
- **Unhandled promise rejections.** Application bootstrap in both NestJS
  services, and TypeORM datasource initialisation, now handle rejection instead
  of discarding it; deliberate fire-and-forget calls are explicitly voided with
  a rejection handler.
- **Frontend test suite could not run.** A test targeted modules that no longer
  exist and has been removed, and the ESM-only Cardano serialization library is
  now mapped to a test double so Jest can resolve it.

### Changed

- **Licence.** The repository now ships the full Apache License 2.0 text with
  the copyright line completed; the `LICENSE` file was previously empty. All
  three `package.json` files declare `Apache-2.0` where they previously declared
  `UNLICENSED` or nothing at all.
- **`CODE-OF-CONDUCT.md` renamed to `CODE_OF_CONDUCT.md`**, the conventional
  name, and its placeholder enforcement contact replaced with a working private
  channel.
- **Lint is now a gate.** The `lint` script no longer runs ESLint with `--fix`,
  which mutated the working tree and made the check pass unconditionally; the
  mutating form is available as `lint:fix`. `no-floating-promises` is enforced
  as an error.
- **ESLint dependency alignment.** `@eslint/js` moved from a v10 requirement to
  `^9.18.0` to match ESLint 9, so a clean install no longer depends on lockfile
  resolution luck.
- **Timeline page size** is exposed as the exported `TIMELINE_EPOCHS_PER_PAGE`
  constant, and the specs assert against it rather than a hard-coded literal.
- **CI workflow hardening.** Least-privilege `permissions` at workflow and job
  level, a concurrency group, and every third-party action pinned to a commit
  SHA rather than a floating tag.
- Voting stake calculation was unified across proposal components, DRep voting
  power is calculated in ada units and excludes always-abstain delegated stake,
  and governance lifecycle epochs are normalised against the current epoch.
- Deployment moved from an in-application image pull secret to a node-level one.

### Removed

- **Plaintext database credentials.** `config/secrets/postgres_db`,
  `config/secrets/postgres_password` and `config/secrets/postgres_user` are no
  longer tracked; `.example` templates replace them and the directory is
  ignored. **The historical values remain in git history and must be treated as
  disclosed.**
- **Insecure JWT fallback.** `JwtStrategy` no longer falls back to a hard-coded
  `default-secret` signing key when `JWT_SECRET` is unset; it now fails at
  startup.
- The unused top-level `secrets:` block in `docker-compose.yaml`, which no
  service referenced.
- A duplicate `package-lock.json` in `queue-backend`, which carried both npm and
  Yarn lockfiles.
