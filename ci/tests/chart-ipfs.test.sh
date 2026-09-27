#!/bin/sh
# helm template tests for the IPFS cluster settings in the chart
# (lidonation#791).
#
# Usage: sh ci/tests/chart-ipfs.test.sh   (set HELM to pick a helm binary)
#
# Each case renders a throwaway copy of chart/ with sample env files, so the
# working tree is never touched. Only dummy values are used.

set -u

here=$(cd "$(dirname "$0")" && pwd)
chart_src="$here/../../chart"
helm=${HELM:-helm}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT INT TERM

secret='sentinel-Pa55-7f3a91'
url='http://ipfs.test:9094'
user='tester'
gateway='https://gw.test'
failures=0
count=0

b64() { printf '%s' "$1" | base64 | tr -d '\n'; }

pass() { count=$((count + 1)); }
fail() {
  count=$((count + 1))
  failures=$((failures + 1))
  echo "FAIL $1"
  sed 's/^/    | /' "$tmp/out" | head -40
}

# Fresh chart copy with clean env files. Arguments are extra lines for
# backend_env, queue_env, frontend_env and global_env, in that order.
new_chart() {
  rm -rf "$tmp/chart"
  cp -R "$chart_src" "$tmp/chart"
  rm -f "$tmp/chart/backend_env" "$tmp/chart/queue_env" "$tmp/chart/frontend_env" "$tmp/chart/global_env"
  printf 'APP_URL=https://example.test\n%s\n' "${1:-}" > "$tmp/chart/backend_env"
  printf 'QUEUE_NAME=jobs\n%s\n' "${2:-}" > "$tmp/chart/queue_env"
  printf 'NEXT_PUBLIC_API=https://api.example.test\n%s\n' "${3:-}" > "$tmp/chart/frontend_env"
  printf 'DATABASE_URL=postgres://u:p@db:5432/x\n%s\n' "${4:-}" > "$tmp/chart/global_env"
}

render() {
  "$helm" template www-1694 "$tmp/chart" -f "$tmp/chart/values.yaml" "$@" > "$tmp/out" 2>&1
  rc=$?
}

render_all_set() {
  render \
    --set-string ipfs.clusterApiUrl="$url" \
    --set-string ipfs.clusterApiUser="$user" \
    --set-string ipfs.clusterApiPassword="$secret" \
    --set-string ipfs.gatewayUrl="$gateway" \
    "$@"
}

# Prints the rendered document that came from one template file.
doc() {
  awk -v src="www-1694/templates/$1" '/^# Source: /{p = ($3 == src)} p' "$tmp/out"
}

expect_rc_zero() {
  if [ "$rc" -eq 0 ]; then pass; else fail "$1: helm exited $rc, wanted 0"; fi
}

expect_render_error() {
  if [ "$rc" -ne 0 ] && grep -q -- "$1" "$tmp/out"; then
    pass
  else
    fail "$2: wanted a failed render mentioning '$1' (exit $rc)"
  fi
}

expect_no_secret() {
  if grep -q -- "$secret" "$tmp/out"; then fail "$1: the password was printed in clear"; else pass; fi
}

expect_doc_line() {
  if doc "$1" | grep -Eq -- "$2"; then pass; else fail "$3: $1 lacks /$2/"; fi
}

expect_no_doc_line() {
  if doc "$1" | grep -Eq -- "$2"; then fail "$3: $1 has /$2/"; else pass; fi
}

# With dummy values the backend Secret carries all four keys, next to the
# env-file keys, and the password is only there base64 encoded.
new_chart
render_all_set
expect_rc_zero "render with all four set"
expect_doc_line secret.backend.yaml "^ *IPFS_CLUSTER_API_URL: $(b64 "$url")\$" "all four set"
expect_doc_line secret.backend.yaml "^ *IPFS_CLUSTER_API_USER: $(b64 "$user")\$" "all four set"
expect_doc_line secret.backend.yaml "^ *IPFS_CLUSTER_API_PASSWORD: $(b64 "$secret")\$" "all four set"
expect_doc_line secret.backend.yaml "^ *IPFS_GATEWAY_URL: $(b64 "$gateway")\$" "all four set"
expect_doc_line secret.backend.yaml "^ *APP_URL: $(b64 'https://example.test')\$" "env-file keys kept"
expect_no_secret "render with all four set"

# The keys stay out of every other Secret, the frontend pods never load the
# backend Secret, and the backend and queue pods do.
for other in secret.frontend.yaml secret.queue.yaml secret.global.yaml; do
  expect_no_doc_line "$other" "IPFS_" "keys only in the backend Secret"
done
expect_no_doc_line deployment.frontend.yaml "backend-secrets" "frontend does not load the backend Secret"
expect_doc_line deployment.backend.yaml "name: \"www-1694-backend-secrets\"" "backend loads the backend Secret"
expect_doc_line deployment.queue.yaml "name: \"www-1694-backend-secrets\"" "queue loads the backend Secret"

# The production values render the same way.
render_all_set -f "$tmp/chart/values.prod.yaml"
expect_rc_zero "render with values.prod.yaml"
expect_doc_line secret.backend.yaml "^ *IPFS_CLUSTER_API_PASSWORD: $(b64 "$secret")\$" "production values"

# Each of the four is required.
for pair in clusterApiUrl:"$url" clusterApiUser:"$user" clusterApiPassword:"$secret" gatewayUrl:"$gateway"; do
  missing=${pair%%:*}
  set --
  for other in clusterApiUrl:"$url" clusterApiUser:"$user" clusterApiPassword:"$secret" gatewayUrl:"$gateway"; do
    name=${other%%:*}
    [ "$name" = "$missing" ] && continue
    set -- "$@" --set-string "ipfs.$name=${other#*:}"
  done
  render "$@"
  expect_render_error "ipfs.$missing is not set" "render without ipfs.$missing"
  expect_no_secret "render without ipfs.$missing"
done

# An explicitly empty password is refused too.
render_all_set --set-string ipfs.clusterApiPassword=
expect_render_error "ipfs.clusterApiPassword is not set" "render with an empty password"

# A release made before this change has no ipfs block. helm upgrade
# --reuse-values (the deploy-indexer jobs) then renders without one, and the
# render must stop with the required message, not a nil pointer error.
render --set ipfs=null
expect_render_error "ipfs.clusterApiUrl is not set" "render with no ipfs block at all"

# An env file that would also produce one of the keys stops the render, and the
# message names the key and the file but never the value.
new_chart "IPFS_CLUSTER_API_PASSWORD=$secret"
render_all_set
expect_render_error "IPFS_CLUSTER_API_PASSWORD is also set in backend_env" "password in backend_env"
expect_no_secret "password in backend_env"

new_chart "" "export IPFS_GATEWAY_URL=https://gw.other"
render_all_set
expect_render_error "IPFS_GATEWAY_URL is also set in queue_env" "gateway in queue_env"

new_chart "" "" "IPFS_CLUSTER_API_URL=http://other"
render_all_set
expect_render_error "IPFS_CLUSTER_API_URL is also set in frontend_env" "URL in frontend_env"

new_chart "" "" "" "IPFS_CLUSTER_API_USER=someone"
render_all_set
expect_render_error "IPFS_CLUSTER_API_USER is also set in global_env" "user in global_env"

# Lines that only look similar are left alone.
new_chart "# IPFS_CLUSTER_API_PASSWORD=$secret
IPFS_CLUSTER_API_URL_OLD=http://old
IPFS_GATEWAY=https://other.gateway" "IPFS_KUBO_API_URL=http://kubo:5001" "NEXT_PUBLIC_IPFS_GATEWAY=https://other.gateway"
render_all_set
expect_rc_zero "commented and similarly named keys"

echo "chart-ipfs: $count checks, $failures failed ($("$helm" version --short 2>/dev/null))"
[ "$failures" -eq 0 ]
