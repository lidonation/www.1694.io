#!/bin/sh
# Render the storage templates in isolation; no cluster or credentials required.
set -eu
here=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
chart_src="$here/../../chart"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT INT TERM
mkdir -p "$tmp/chart/templates"
cp "$chart_src/Chart.yaml" "$chart_src/values.yaml" "$tmp/chart/"
cp "$chart_src/templates/redis.cluster.yaml" "$tmp/chart/templates/"

cp "$chart_src/values.prod.yaml" "$tmp/chart/"
for environment in preview production; do
  set --
  if [ "$environment" = production ]; then set -- -f "$tmp/chart/values.prod.yaml"; fi
  helm template backups "$tmp/chart" "$@" > "$tmp/rendered"
  # Opstree overwrites claim-template labels with the Redis resource labels.
  # Assert the label is on the resource metadata, where the operator reads it.
  awk '
    /^kind: Redis$/ {redis=1; next}
    redis && /^spec:/ {exit !found}
    redis && /^    backup[.]2lovelaces[.]io\/exclude: "true"$/ {found=1}
    END {if (!redis || !found) exit 1}
  ' "$tmp/rendered"

  echo "ok $environment backup exclusions"
done
