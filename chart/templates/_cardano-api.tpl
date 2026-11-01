{{- define "www-1694.cardanoApiEnv" -}}
{{- $api := .Values.cardanoApi | default dict -}}
{{- $network := $api.network | default "" -}}
{{- if not (has $network (list "preview" "mainnet")) -}}
{{- fail "cardanoApi.network must be preview or mainnet. For a legacy --reuse-values release, run a full app deploy with the current values files first." -}}
{{- end -}}
- name: CARDANO_API_URL
  value: {{ printf "http://koios-gateway-%s-koios-gateway.koios-gateway.svc.cluster.local/api/v0" $network | quote }}
- name: CARDANO_API_PROJECT_ID
  valueFrom:
    secretKeyRef:
      name: {{ printf "%s-backend-secrets" .Chart.Name }}
      key: CARDANO_API_PROJECT_ID
{{- end -}}
