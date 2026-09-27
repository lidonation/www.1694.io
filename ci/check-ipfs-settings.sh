#!/bin/sh
# Stops a deploy before any helm or kubectl call when the IPFS cluster
# settings are not right for this environment (lidonation#791).
#
# Usage: sh ci/check-ipfs-settings.sh [ENV_FILE ...]
#
# Fails when one of the four settings is missing or empty, or when one of the
# env files the job loads into the pods also sets it. Each setting lives only
# in its own CI/CD variable. Messages name the key, the file and
# $CI_ENVIRONMENT_NAME, never a value.

# Keep tracing off even if a caller runs this with sh -x.
set +x

keys='IPFS_CLUSTER_API_URL IPFS_CLUSTER_API_USER IPFS_CLUSTER_API_PASSWORD IPFS_GATEWAY_URL'
environment=${CI_ENVIRONMENT_NAME:-unknown}
status=0

for key in $keys; do
  # The value goes through a pipe, so it is never expanded on a command line.
  if ! printenv "$key" | grep -q .; then
    echo "ERROR: $key is not set for environment $environment. Add it as a CI/CD variable scoped to that environment." >&2
    status=1
  fi
done

for file in "$@"; do
  if [ -z "$file" ]; then
    echo "ERROR: an env file argument is empty for environment $environment. Check the job's file variables." >&2
    status=1
    continue
  fi
  if [ ! -r "$file" ]; then
    echo "ERROR: env file $file is not readable for environment $environment." >&2
    status=1
    continue
  fi
  for key in $keys; do
    if grep -Eq "^[[:space:]]*(export[[:space:]]+)?${key}[[:space:]]*=" "$file"; then
      echo "ERROR: $key is also set in env file $file for environment $environment. Remove it there and keep it only as its own CI/CD variable." >&2
      status=1
    fi
  done
done

exit "$status"
