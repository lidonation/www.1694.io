#!/bin/sh
# Cluster-free checks for agent selection and CI ordering.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM
mkdir "$tmp/bin"
cat > "$tmp/bin/kubectl" <<'STUB'
#!/bin/sh
printf '%s\n' "$*" >> "$CALLS"
[ "${KUBECTL_FAIL:-0}" = 0 ]
STUB
chmod +x "$tmp/bin/kubectl"
export PATH="$tmp/bin:$PATH" CALLS="$tmp/calls"
helper="$root/ci/select-kube-context.sh"

if KUBE_CONTEXT='' sh "$helper" >"$tmp/out" 2>&1; then
  echo 'FAIL missing context was accepted'; exit 1
fi
[ ! -e "$CALLS" ]
if KUBE_CONTEXT='2lovelaces/infrastructure:contabo' sh "$helper" >"$tmp/out" 2>&1; then
  echo 'FAIL infrastructure admin context was accepted'; exit 1
fi
[ ! -e "$CALLS" ]
: > "$tmp/kubeconfig"
chmod 644 "$tmp/kubeconfig"
KUBE_CONTEXT='voltaire/cluster-agent:contabo' KUBECONFIG="$tmp/kubeconfig" sh "$helper"
[ "$(cat "$CALLS")" = 'config use-context voltaire/cluster-agent:contabo' ]
# -perm works with both BSD find and BusyBox; do not depend on GNU stat.
[ -n "$(find "$tmp/kubeconfig" -perm 600 -print)" ]
if KUBE_CONTEXT='voltaire/cluster-agent:contabo' KUBECTL_FAIL=1 sh "$helper" >"$tmp/out" 2>&1; then
  echo 'FAIL unavailable context did not stop deployment'; exit 1
fi

awk '
  /^[A-Za-z0-9_.-]+:[[:space:]]*$/ { job=$1; sub(/:$/, "", job) }
  /!reference \[\.check_ipfs_settings, script\]/ { guard[job]=NR }
  /sh ci\/select-kube-context.sh/ { selection[job]=NR }
  /--set preserveExistingAppEnv=true/ { preserve[job]=1 }
  /auto-deploy download_chart|helm upgrade/ { if (!first_cluster[job]) first_cluster[job]=NR }
  END {
    n=split("app-preview production deploy-indexer-preview deploy-indexer-production", jobs, " ")
    for (i=1;i<=n;i++) {
      j=jobs[i]
      if (!selection[j] || !guard[j] || guard[j]>=selection[j] || selection[j]>=first_cluster[j]) {
        print "FAIL context selection missing or ordered incorrectly: " j; exit 1
      }
      if (j ~ /^deploy-indexer-/ && !preserve[j]) {
        print "FAIL indexer-only deploy must preserve existing app Secrets: " j; exit 1
      }
    }
  }
' "$root/.gitlab-ci.yml"
if grep -q 'KUBERNETES_SERVICE_ACCOUNT_OVERWRITE:' "$root/.gitlab-ci.yml"; then
  echo 'FAIL legacy runner service-account override remains'; exit 1
fi
echo 'select-kube-context: all checks passed'
