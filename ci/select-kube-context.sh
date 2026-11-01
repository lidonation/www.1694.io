#!/bin/sh
# Use Voltaire's namespace-scoped agent before any Helm or Kubernetes operation.
set +x
set -eu

expected_context='voltaire/cluster-agent:contabo'
if [ "${KUBE_CONTEXT:-}" != "$expected_context" ]; then
  echo "ERROR: KUBE_CONTEXT must select voltaire/cluster-agent:contabo; refusing the runner's default Kubernetes identity." >&2
  exit 1
fi

# GitLab injects a file kubeconfig. Keep its contents out of logs and private.
# kubectl also supports merged configs, so do not treat a path list as one file.
if [ -n "${KUBECONFIG:-}" ] && [ -f "$KUBECONFIG" ]; then
  chmod 600 "$KUBECONFIG"
fi

kubectl config use-context "$KUBE_CONTEXT"
