# Project Governance

This document describes how the 1694.io project is governed: who makes
decisions, how those decisions are made, how someone becomes a maintainer, and
how the project handles releases and disagreements.

It complements two neighbouring documents. [MAINTAINERS.md](./MAINTAINERS.md)
lists the people currently holding each role; [CONTRIBUTING.md](./CONTRIBUTING.md)
describes the mechanics of submitting a change. This document describes the
structure those two operate inside.

## Project scope

1694.io is a platform that enables technical and non-technical DReps (Cardano
Delegated Representatives) to create profiles, communicate with delegators, and
showcase their on-chain and off-chain activity. The project was funded by
Intersect MBO and originally developed by the LIDO Nation team.

The codebase covers four deployable components — a NestJS API backend, a NestJS
queue backend, a Next.js frontend, and a Cardano governance indexer — plus the
Helm chart and Docker Compose definitions used to run them.

## Roles

The project uses three roles. They are cumulative: every maintainer is also a
contributor.

### Contributor

Anyone who submits an issue, a patch, a documentation fix, a translation or a
review is a contributor. No prior association with the project is required and
no permission is needed to start. Contributors have no repository write access;
their changes reach the project through review by a maintainer.

### Core maintainer

Core maintainers have write access to the canonical repository. They review and
merge changes, triage issues, and are collectively responsible for the health of
the codebase. A core maintainer is expected to:

- review pull requests in their area of expertise within a reasonable time,
- uphold the quality, testing and documentation standards described in
  [CONTRIBUTING.md](./CONTRIBUTING.md),
- mentor contributors and help newcomers land their first change,
- participate in technical decisions and in maintainer votes.

### Lead maintainer

One core maintainer serves as lead maintainer. The lead maintainer holds the
casting vote on architecture, owns the roadmap, coordinates releases, and
represents the project to funders and to the wider Cardano ecosystem. The role
is a tie-breaker and a coordination point, not a veto over the other
maintainers: a lead maintainer who is repeatedly outvoted is expected to defer.

The current holders of each role are listed in
[MAINTAINERS.md](./MAINTAINERS.md).

## Decision making

The project runs on lazy consensus. Most changes need no formal process: a
maintainer approves a change, it merges, and anyone who objects says so in
review. Formal votes exist for the cases where lazy consensus is not enough.

| Decision | Requirement |
| --- | --- |
| Bug fix, documentation, dependency bump, refactor | Approval from one core maintainer |
| New feature, user-visible behaviour change | Approval from two core maintainers |
| Architecture change, new service, new datastore, breaking API change | Approval from the lead maintainer plus one core maintainer |
| Cutting a release | Lead maintainer, having consulted the core maintainers |
| Adding or removing a maintainer | Two-thirds majority of core maintainers |
| Changing this document | Two-thirds majority of core maintainers |

Votes are held in the open, on the merge request or issue that proposes the
change, and stay open for at least 72 hours so that maintainers in other time
zones can participate. A maintainer may vote +1 (agree), 0 (abstain) or -1
(object). An objection must come with a reason and, where possible, a suggested
alternative; an unexplained -1 does not block.

If a vote deadlocks, the lead maintainer decides and records the reasoning on
the issue.

## Becoming a maintainer

Maintainership is earned through sustained contribution, and it is offered
rather than applied for. The criteria are:

- a track record of merged, high-quality contributions over several months,
- demonstrated understanding of the codebase and its architecture,
- constructive participation in review and in issue triage,
- willingness to take on the review load the role implies.

The process:

1. A current core maintainer nominates the candidate, in private, to the other
   core maintainers.
2. The core maintainers vote. A two-thirds majority carries.
3. The nominee is asked, and accepts or declines.
4. On acceptance, [MAINTAINERS.md](./MAINTAINERS.md) is updated in a merge
   request and repository access is granted.

Maintainers who have been inactive for six months may be moved to emeritus
status in MAINTAINERS.md by the same two-thirds vote. This is administrative
housekeeping and carries no criticism; returning contributors can be reinstated
by a further vote.

## Repository layout and where work happens

The canonical repository is hosted on the project's self-hosted GitLab, and is
push-mirrored to <https://github.com/lidonation/www.1694.io>, which is public
and read-only.

Consequences for contributors:

- **Issues and discussion** are welcome on the GitHub mirror; maintainers
  monitor them.
- **Pull requests opened on the GitHub mirror cannot be merged there.** The
  mirror is one-way, and a merge on GitHub would be overwritten by the next
  sync. A maintainer will review your PR on GitHub, then apply the change to the
  canonical repository with authorship preserved, and it will appear on the
  mirror on the following sync.
- `dev` is the integration branch and the default branch. `main` tracks what is
  deployed to production. Feature branches target `dev`.

## Releases

The project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Releases are cut from `dev`, tagged `vMAJOR.MINOR.PATCH`, recorded in
[CHANGELOG.md](./CHANGELOG.md), and published as a release on the GitHub mirror.

- **Patch** releases carry bug fixes and security fixes only.
- **Minor** releases add backwards-compatible functionality.
- **Major** releases may break the public HTTP API or the deployment contract,
  and must document the migration path in the changelog.

The lead maintainer coordinates releases after consulting the core maintainers.
Security fixes may be released out of band, without waiting for the next planned
release.

## Security

Vulnerabilities must not be reported in public issues. See
[SECURITY.md](./SECURITY.md) for the private reporting channel and the response
commitments that go with it.

## Code of conduct

All participants are bound by the [Code of Conduct](./CODE_OF_CONDUCT.md).
Enforcement is the responsibility of the core maintainers. Reports are handled
confidentially; a maintainer who is the subject of a report recuses themselves
from handling it.

## Licensing and contributor terms

The project is licensed under the Apache License 2.0; see [LICENSE](./LICENSE).
By submitting a contribution you agree that it is licensed under those same
terms. The project does not require a separate contributor licence agreement.

Dependencies must carry an OSI-approved licence compatible with Apache 2.0.
Introducing a copyleft or source-available dependency is an architecture-level
decision and needs the corresponding approval.

## Amending this document

Changes to governance are proposed as a merge request against this file and
carried by a two-thirds majority of core maintainers, under the same 72-hour
window as any other vote.
