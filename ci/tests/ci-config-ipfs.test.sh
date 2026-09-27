#!/bin/sh
# Checks .gitlab-ci.yml (lidonation#791): every job that runs `helm upgrade`
# on the chart runs the IPFS settings check first and passes all four
# ipfs.* values. A job that skips them either renders a backend Secret
# without the keys or fails `required` in secret.backend.yaml. That includes
# the --reuse-values indexer deploys, which re-render every template.
#
# Usage: sh ci/tests/ci-config-ipfs.test.sh [path/to/.gitlab-ci.yml]

set -u

here=$(cd "$(dirname "$0")" && pwd)
ci_file=${1:-"$here/../../.gitlab-ci.yml"}

# One line per job that runs helm upgrade: "<job> <problem>" for each problem,
# or "<job> ok". A job starts at a top-level "name:" line.
report=$(awk '
  function flush() {
    if (job != "" && helm_line) {
      bad = 0
      if (!check_line || check_line > helm_line) { print job " check-not-first"; bad = 1 }
      split("clusterApiUrl clusterApiUser clusterApiPassword gatewayUrl", k, " ")
      for (i = 1; i <= 4; i++) if (!(k[i] in flags)) { print job " missing-" k[i]; bad = 1 }
      if (!bad) print job " ok"
    }
    job = ""; helm_line = 0; check_line = 0; delete flags
  }
  /^[A-Za-z0-9_.-]+:[[:space:]]*$/ { flush(); job = $1; sub(/:$/, "", job); next }
  job == "" { next }
  /!reference \[\.check_ipfs_settings, script\]/ { if (!check_line) check_line = NR }
  /auto-deploy download_chart|helm upgrade/ { if (!helm_line) helm_line = NR }
  {
    line = $0
    while (match(line, /--set-string ipfs\.[A-Za-z]+=/)) {
      f = substr(line, RSTART + 18, RLENGTH - 19); flags[f] = 1
      line = substr(line, RSTART + RLENGTH)
    }
  }
  END { flush() }
' "$ci_file")

failures=0
count=0
for job in app-preview production deploy-indexer-preview deploy-indexer-production; do
  count=$((count + 1))
  if ! printf '%s\n' "$report" | grep -q "^$job "; then
    echo "FAIL $job: no helm upgrade found in $ci_file"
    failures=$((failures + 1))
  fi
done
problems=$(printf '%s\n' "$report" | grep -v ' ok$' || true)
count=$((count + 1))
if [ -n "$problems" ]; then
  printf '%s\n' "$problems" | sed 's/^/FAIL /'
  failures=$((failures + 1))
fi

echo "ci-config-ipfs: $count checks, $failures failed"
[ "$failures" -eq 0 ]
