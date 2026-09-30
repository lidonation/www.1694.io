#!/bin/sh
# Frontend runtime configuration comes from the generated frontend and global
# Secrets. The Deployment must not add one-off env entries that can override a
# valid envFrom value with an empty Helm value.

set -u

here=$(cd "$(dirname "$0")" && pwd)
root="$here/../.."
chart_src="$root/chart"
ci_file="$root/.gitlab-ci.yml"
helm=${HELM:-helm}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT INT TERM

failures=0
count=0

pass() { count=$((count + 1)); }
fail() {
  count=$((count + 1))
  failures=$((failures + 1))
  echo "FAIL $1"
}

expect_absent() {
  if grep -Eq -- "$2" "$1"; then fail "$3"; else pass; fi
}

cp -R "$chart_src" "$tmp/chart"
printf 'APP_URL=https://example.test\n' > "$tmp/chart/backend_env"
printf 'QUEUE_NAME=jobs\n' > "$tmp/chart/queue_env"
printf 'NEXT_PUBLIC_BASE_URL_API=https://api.example.test\n' > "$tmp/chart/frontend_env"
printf 'DATABASE_URL=postgres://u:p@db:5432/x\n' > "$tmp/chart/global_env"

"$helm" template www-1694 "$tmp/chart" \
  --set-string ipfs.clusterApiUrl=http://ipfs.test:9094 \
  --set-string ipfs.clusterApiUser=tester \
  --set-string ipfs.clusterApiPassword=test-password \
  --set-string ipfs.gatewayUrl=https://ipfs.test > "$tmp/rendered"

awk '/^# Source: www-1694\/templates\/deployment.frontend.yaml$/{p=1; next} /^---$/{if(p) exit} p' \
  "$tmp/rendered" > "$tmp/frontend-deployment"

# envFrom is the only environment source for the frontend container. This
# prevents an empty explicit env value from masking the generated Secret.
if grep -q '^ *envFrom:$' "$tmp/frontend-deployment"; then pass; else fail "frontend Deployment lacks envFrom"; fi
if grep -q 'name: "www-1694-frontend-secrets"' "$tmp/frontend-deployment"; then pass; else fail "frontend Secret is not loaded"; fi
expect_absent "$tmp/frontend-deployment" '^ *env:$' "frontend Deployment contains explicit env overrides"

# Deploy jobs must not pass ad-hoc frontend secrets through Helm, and the chart
# must not retain an unused values block for them.
expect_absent "$ci_file" '--set(-string)? secrets\.' "CI passes an ad-hoc frontend secret through Helm"
expect_absent "$chart_src/values.yaml" '^secrets:' "chart values retain an unused secrets block"

# No source file may reach directly into a browser-visible Google credential;
# runtime public configuration belongs in the frontend env file.
if git -C "$root" grep -Il -E 'process\.env\.NEXT_PUBLIC_.*GOOGLE' -- \
  frontend backend queue-backend >/dev/null 2>&1; then
  fail "application source reads a public Google credential"
else
  pass
fi

echo "frontend-runtime-env: $count checks, $failures failed ($("$helm" version --short 2>/dev/null))"
[ "$failures" -eq 0 ]
