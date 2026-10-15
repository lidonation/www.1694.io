{{/*
Every hostname this release serves, in listener order: the site hosts, the API
host, then the apex when it is redirected to www.
*/}}
{{- define "www-1694.gateway.hostnames" -}}
{{- $hosts := list -}}
{{- range .Values.gateway.hosts }}{{ $hosts = append $hosts . }}{{ end -}}
{{- if .Values.gateway.api }}{{ $hosts = append $hosts .Values.gateway.api }}{{ end -}}
{{- if .Values.gateway.redirectApex }}{{ $hosts = append $hosts (required "gateway.apexHost is required when gateway.redirectApex is true" .Values.gateway.apexHost) }}{{ end -}}
{{- toJson $hosts -}}
{{- end -}}

{{/* Listener name for a hostname: https-www-1694-io. */}}
{{- define "www-1694.gateway.listener" -}}
https-{{ . | replace "." "-" | replace "*" "wild" }}
{{- end -}}

{{/* parentRefs for an HTTPS route bound to the listener of each given host. */}}
{{- define "www-1694.gateway.parentRefs" -}}
{{- range .hosts }}
- group: gateway.networking.k8s.io
  kind: Gateway
  name: {{ $.gateway }}
  sectionName: {{ include "www-1694.gateway.listener" . }}
{{- end }}
{{- end -}}

{{/*
The response headers the old traefik/default-headers middleware set on every
Ingress (HSTS, nosniff, frame options, XSS filter), as a standard Gateway API
filter so the chart does not depend on a Traefik CRD living in another
namespace.
*/}}
{{- define "www-1694.gateway.securityHeaders" -}}
- type: RequestHeaderModifier
  requestHeaderModifier:
    set:
      - {name: X-Forwarded-Proto, value: https}
- type: ResponseHeaderModifier
  responseHeaderModifier:
    set:
      - {name: Strict-Transport-Security, value: "max-age=15552000; includeSubDomains; preload"}
      - {name: X-Content-Type-Options, value: nosniff}
      - {name: X-Frame-Options, value: SAMEORIGIN}
      - {name: X-XSS-Protection, value: "1; mode=block"}
{{- end -}}
