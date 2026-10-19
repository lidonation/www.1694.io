{{/* Parent/listener/TLS ownership stays with the shared platform. */}}
{{- define "www-1694.gateway.parentRefs" -}}
{{- if (.root.Values.httpRoute.listenerSet | default dict).enabled }}
- group: gateway.networking.k8s.io
  kind: ListenerSet
  name: {{ include "www-1694.listenerSetName" .root | quote }}
{{- end }}
{{- if or (not (.root.Values.httpRoute.listenerSet | default dict).enabled) (.root.Values.httpRoute.listenerSet | default dict).keepGatewayParent }}
- name: {{ .root.Values.httpRoute.gateway.name | quote }}
  namespace: {{ .root.Values.httpRoute.gateway.namespace | quote }}
{{- end }}
{{- end }}

{{/* App-specific headers remain local; HSTS/nosniff come from websecure. */}}
{{- define "www-1694.gateway.securityHeaders" -}}
- type: RequestHeaderModifier
  requestHeaderModifier:
    set:
      - {name: X-Forwarded-Proto, value: https}
- type: ResponseHeaderModifier
  responseHeaderModifier:
    set:
      - {name: X-Frame-Options, value: SAMEORIGIN}
      - {name: X-XSS-Protection, value: "1; mode=block"}
{{- end -}}

{{- define "www-1694.listenerSetName" -}}
{{- printf "%s-domain" .Release.Name -}}
{{- end }}

{{/* Derive listeners from exactly the frontend/API/apex routes being emitted. */}}
{{- define "www-1694.listenerSetHosts" -}}
{{- $hosts := .Values.gateway.hosts | default (list) }}
{{- if .Values.gateway.api }}
{{- $hosts = append $hosts .Values.gateway.api }}
{{- end }}
{{- if .Values.gateway.redirectApex }}
{{- $hosts = append $hosts (required "gateway.apexHost is required when gateway.redirectApex is true" .Values.gateway.apexHost) }}
{{- end }}
{{- toJson (uniq $hosts) }}
{{- end }}
