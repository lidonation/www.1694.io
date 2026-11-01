#!/bin/sh
# Cluster-free credential-presence and deploy-order regression checks.
set -eu
root=$(cd "$(dirname "$0")/../.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM
helper="$root/ci/check-cardano-settings.sh"
key=abcdefghijklmnopqrstuvwxyz0123456789_-
if sh "$helper" >"$tmp/out" 2>&1 || sh "$helper" "$tmp/missing" >"$tmp/out" 2>&1; then
  echo 'FAIL missing file accepted'; exit 1
fi
for content in '' 'OTHER=value' 'CARDANO_API_PROJECT_ID=' 'CARDANO_API_PROJECT_ID=short' "CARDANO_API_PROJECT_ID=\"$key\"" "CARDANO_API_PROJECT_ID=$key bad" "CARDANO_API_PROJECT_ID=$key
CARDANO_API_PROJECT_ID=$key"; do
  printf '%s\n' "$content" > "$tmp/env"
  if sh "$helper" "$tmp/env" >"$tmp/out" 2>&1; then
    echo 'FAIL malformed or duplicate credential accepted'; exit 1
  fi
  if grep -F "$key" "$tmp/out" >/dev/null; then
    echo 'FAIL credential logged'; exit 1
  fi
done
printf '# unrelated setting\nOTHER=value\nCARDANO_API_PROJECT_ID=%s\n' "$key" > "$tmp/env"
sh "$helper" "$tmp/env" >"$tmp/out" 2>&1
[ ! -s "$tmp/out" ]
awk '
  /^[A-Za-z0-9_.-]+:[[:space:]]*$/ { job=$1; sub(/:$/, "", job) }
  /sh ci\/check-cardano-settings.sh/ { guard[job]=NR }
  /sh ci\/select-kube-context.sh/ { selection[job]=NR }
  END {
    n=split("app-preview production deploy-indexer-preview deploy-indexer-production", jobs, " ")
    for (i=1;i<=n;i++) {
      j=jobs[i]
      if (!guard[j] || !selection[j] || guard[j]>=selection[j]) {
        print "FAIL Cardano credential check missing or ordered incorrectly: " j; exit 1
      }
    }
  }
' "$root/.gitlab-ci.yml"
echo 'check-cardano-settings: all checks passed'
