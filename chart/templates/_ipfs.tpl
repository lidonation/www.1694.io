{{/*
IPFS cluster settings (lidonation#791). The four keys come only from their
own CI/CD variables, through the ipfs.* values. An env file that would also
produce one of them stops the render, so a Secret never carries the key
twice and a later envFrom source never shadows it.
Usage: include "www-1694.ipfs.rejectEnvKey" (dict "key" $key "file" "backend_env")
*/}}
{{- define "www-1694.ipfs.rejectEnvKey" -}}
{{- $key := trim (regexReplaceAll "^\\s*export\\s+" .key "") -}}
{{- if has $key (list "IPFS_CLUSTER_API_URL" "IPFS_CLUSTER_API_USER" "IPFS_CLUSTER_API_PASSWORD" "IPFS_GATEWAY_URL") -}}
{{- fail (printf "%s is also set in %s. Remove it there and keep it only as its own CI/CD variable (lidonation#791)." $key .file) -}}
{{- end -}}
{{- end -}}
