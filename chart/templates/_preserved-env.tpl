{{/* Lookup keeps credentials in Kubernetes and the Helm release, never values. */}}
{{- define "www-1694.preservedEnv" -}}
{{- if .root.Files.Get .file }}
{{- fail "preserveExistingAppEnv requires CI env files to be omitted; set false for normal environment updates" }}
{{- end }}
{{- $existing := lookup "v1" "Secret" .root.Values.namespace (printf "%s-%s-secrets" .root.Chart.Name .suffix) }}
{{- if not $existing }}
{{- fail "preserveExistingAppEnv requires existing release-owned Secrets; use server-side rendering" }}
{{- end }}
{{- $annotations := $existing.metadata.annotations | default dict }}
{{- if or (ne (index $annotations "meta.helm.sh/release-name") .root.Release.Name) (ne (index $annotations "meta.helm.sh/release-namespace") .root.Release.Namespace) (ne $existing.type "Opaque") (not $existing.data) }}
{{- fail "preserveExistingAppEnv refuses an empty, invalid or differently owned Secret" }}
{{- end }}
{{/* Helm always selects gateway mode; never restore obsolete provider routes. */}}
{{- omit $existing.data "BLOCKFROST_NETWORK_URL_FALLBACK" "BLOCKFROST_NETWORK_PROJECT_ID_FALLBACK" | toYaml }}
{{- end }}
