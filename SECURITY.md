# Security Policy

## Supported versions

The project is developed on the `dev` branch and deployed from `main`. Security
fixes are applied to the latest release; there are no long-term support branches.

| Version | Supported |
| --- | --- |
| 1.0.x | ✅ |
| < 1.0 | ❌ (pre-release, unsupported) |

## Reporting a vulnerability

**Please do not report security vulnerabilities in public issues, merge
requests, or public chat.**

Report them privately through GitHub's private vulnerability reporting on the
public mirror:

<https://github.com/lidonation/www.1694.io/security/advisories/new>

The report is visible only to the maintainers. If you cannot use that form,
contact a maintainer listed in [MAINTAINERS.md](./MAINTAINERS.md) directly and
ask for a private channel before sending details.

Please include:

- the affected component or components (`backend`, `queue-backend`, `frontend`,
  the governance indexer, or the Helm chart) and the version or commit,
- steps that reliably reproduce the issue,
- the impact you believe it has,
- any workaround or mitigation you have identified.

If you have written a proof of concept, mention it in the report and we will
arrange a way to receive it. **Do not attach executables or archives to email**,
as they are likely to be stripped by spam filters.

## What to expect

| Stage | Target |
| --- | --- |
| Acknowledgement of your report | within 3 working days |
| Initial assessment and severity triage | within 7 working days |
| Fix or documented mitigation for a confirmed high or critical issue | within 30 days |

We will keep you informed as the assessment progresses, and we will tell you
when a fix ships. If we conclude that the report is not a vulnerability, we will
explain why.

## Disclosure

We follow coordinated disclosure. We ask that you give us a reasonable
opportunity to ship a fix before publishing details — 90 days is our default,
and we will usually be much faster than that. We will credit reporters in the
advisory and the changelog unless you ask us not to.

## Scope

In scope: the code in this repository, its deployment manifests, and its
dependency configuration.

Out of scope: findings against third-party services the platform integrates with
(report those to the service in question), denial of service through sheer
traffic volume, and reports produced solely by an automated scanner without a
demonstrated impact.
