#!/bin/sh
# Exercise the actual chart with dummy env files; no cluster access.
set -eu
here=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT INT TERM
cp -R "$here/../../chart" "$tmp/chart"
# Existing environment entries must not shadow the explicitly selected route/key.
printf 'CARDANO_API_URL=https://public.example/api/v0\nCARDANO_API_PROJECT_ID=gateway-key\n' > "$tmp/chart/backend_env"
printf 'CARDANO_API_URL=https://wrong.example/api/v0\nCARDANO_API_PROJECT_ID=wrong-key\n' > "$tmp/chart/queue_env"
touch "$tmp/chart/frontend_env" "$tmp/chart/global_env"
render() {
  helm template www-1694 "$tmp/chart" \
    --set-string ipfs.clusterApiUrl=dummy,ipfs.clusterApiUser=dummy,ipfs.clusterApiPassword=dummy,ipfs.gatewayUrl=dummy "$@"
}
for network in preview mainnet; do
  set --
  if [ "$network" = mainnet ]; then set -- -f "$tmp/chart/values.prod.yaml"; fi
  render "$@" > "$tmp/out"
  for component in backend queue; do
    awk -v src="www-1694/templates/deployment.$component.yaml" '/^# Source: /{p=($3==src)} p' "$tmp/out" > "$tmp/deployment"
    grep -A1 'name: CARDANO_API_URL$' "$tmp/deployment" | grep -F "http://koios-gateway-$network-koios-gateway.koios-gateway.svc.cluster.local/api/v0" > /dev/null
    grep -A5 'name: CARDANO_API_PROJECT_ID$' "$tmp/deployment" > "$tmp/keyref"
    grep -F 'valueFrom:' "$tmp/keyref" > /dev/null
    grep -F 'name: www-1694-backend-secrets' "$tmp/keyref" > /dev/null
    grep -F 'key: CARDANO_API_PROJECT_ID' "$tmp/keyref" > /dev/null
    if grep -F 'optional: true' "$tmp/keyref"; then echo 'Gateway key must not be optional' >&2; exit 1; fi
  done
  awk '/^# Source: /{p=($3=="www-1694/templates/deployment.frontend.yaml")} p' "$tmp/out" > "$tmp/frontend"
  if grep -E 'CARDANO_API_|backend-secrets|queue-secrets|koios-gateway' "$tmp/frontend"; then
    echo 'Gateway configuration leaked to frontend' >&2; exit 1
  fi
done
for network in '' invalid 'https://cardanoapis.2lovelaces.com' 'mainnet/api/v0'; do
  if render --set-string "cardanoApi.network=$network" > "$tmp/out" 2>&1; then
    echo "Accepted invalid gateway network: $network" >&2; exit 1
  fi
  grep -F 'cardanoApi.network must be preview or mainnet' "$tmp/out" > /dev/null
done
# Legacy releases upgraded using --reuse-values should fail with actionable guidance.
if render --set cardanoApi=null > "$tmp/out" 2>&1; then
  echo 'Missing network was silently accepted' >&2; exit 1
fi
grep -F 'cardanoApi.network must be preview or mainnet' "$tmp/out" > /dev/null
echo 'chart-cardano-api: preview/mainnet routing, key references, frontend isolation and validation passed'
