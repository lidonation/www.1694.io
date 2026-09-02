# GitLab → GitHub mirror

The canonical repository is `gitlab.2lovelaces.io/voltaire/www.1694.io`. It push-mirrors
to the public `github.com/lidonation/www.1694.io`. The GitHub copy is not a development
remote — it exists so the project has a public, auditable home, and it is the copy that
external compliance tooling reads.

## Why this matters for the Tooling Sustainability Program

The Intersect Open Source Office self-attestation script
(`IntersectMBO/Project-Compliance-Attestation`) works exclusively through the GitHub API:
it resolves `GET /repos/{owner}/{repo}`, reads the repository's **default branch**, and
grades required files, workflow count, commit activity and contributor count against that
branch. There is no GitLab code path and no local mode. Anything that has not reached
GitHub, on the default branch, does not exist as far as the attestation is concerned.

## Two operational requirements

### 1. The mirror credential needs `workflow` scope

The mirror authenticates with a GitHub personal access token. GitHub refuses any push that
creates or updates a file under `.github/workflows/` unless the token carries the
`workflow` scope:

```
! [remote rejected] <branch> -> <branch> (refusing to allow a Personal Access Token to
  create or update workflow `.github/workflows/ci.yml` without `workflow` scope)
```

The whole push is rejected, not just the offending ref, so the mirror run is marked failed.

Because this repository now contains `.github/workflows/ci.yml`, the mirror **cannot**
succeed until the token is reissued with `workflow` scope (classic token: `repo` +
`workflow`) on an account with push rights to `lidonation/www.1694.io`.

To rotate it: GitLab → Settings → Repository → Mirroring repositories → replace the
password field on the existing GitHub mirror with the new token, then "Update now". Update
the credential in place; do not delete and recreate the mirror entry.

### 2. The GitHub default branch must track `dev`

The attestation script grades whichever branch GitHub reports as the default. If that is a
stale feature branch, the report describes code nobody ships. Set the default branch of
`lidonation/www.1694.io` to `dev` under Settings → General → Default branch.

## Branch hygiene

The mirror does not prune: branches deleted on GitLab survive on GitHub. Either delete them
on GitHub when they are removed upstream, or enable "Only mirror protected branches" on the
GitLab mirror so that only `main` and `dev` are published.

## Dependabot

`.github/dependabot.yml` runs on the GitHub side. Because the mirror is one-way, Dependabot
pull requests cannot be merged there — a merge would be overwritten by the next mirror push.
Treat its output as a dependency-advisory feed: apply the upgrade on GitLab, and let the
mirror close the pull request.
