{{- define "www-1694.certificateIssuer" -}}
{{- $root := .root -}}
{{- $certificate := .certificate -}}
{{- $issuer := deepCopy (default (dict "group" "tls.2lovelaces.io" "kind" "ClusterACMEIssuer" "name" "public-acme") $certificate.issuerRef) -}}
{{- if $root.Values.httpRoute.listenerSet.clusterIssuer -}}
{{- $issuer = dict "group" "cert-manager.io" "kind" "ClusterIssuer" "name" $root.Values.httpRoute.listenerSet.clusterIssuer -}}
{{- end -}}
{{- $existing := lookup "cert-manager.io/v1" "Certificate" $root.Release.Namespace $certificate.name -}}
{{- if $existing -}}
{{- $metadata := default dict $existing.metadata -}}
{{- $annotations := default dict $metadata.annotations -}}
{{- $labels := default dict $metadata.labels -}}
{{- $spec := default dict $existing.spec -}}
{{- $usages := default (list "digital signature" "key encipherment") $certificate.usages -}}
{{- if or (ne (get $metadata "name") $certificate.name) (ne (get $metadata "namespace") $root.Release.Namespace) (ne (get $annotations "meta.helm.sh/release-name") $root.Release.Name) (ne (get $annotations "meta.helm.sh/release-namespace") $root.Release.Namespace) (ne (get $labels "app.kubernetes.io/managed-by") "Helm") $metadata.ownerReferences -}}
{{- fail "existing Certificate is not owned by this Helm release and namespace" -}}
{{- end -}}
{{- if or (ne (get $spec "secretName") $certificate.name) (ne (toJson (sortAlpha (default (list) $spec.dnsNames))) (toJson (sortAlpha $certificate.dnsNames))) (ne (toJson (sortAlpha (default (list) $spec.usages))) (toJson (sortAlpha $usages))) -}}
{{- fail "existing Certificate secret, DNS names or usages differ from the adoption contract" -}}
{{- end -}}
{{- range $key, $_ := $spec -}}
{{- if not (has $key (list "secretName" "dnsNames" "usages" "issuerRef")) -}}
{{- fail "existing Certificate has unsupported certificate policy" -}}
{{- end -}}
{{- end -}}
{{- $live := default dict $spec.issuerRef -}}
{{- $group := default "cert-manager.io" $live.group -}}
{{- $kind := default "Issuer" $live.kind -}}
{{- $name := default "" $live.name -}}
{{- $builtin := and (eq $group "cert-manager.io") (eq $kind "ClusterIssuer") (has $name (list "letsencrypt-prod-cluster-issuer" "zerossl-prod-cluster-issuer")) -}}
{{- $external := and (eq $group "tls.2lovelaces.io") (eq $kind "ClusterACMEIssuer") (eq $name "public-acme") -}}
{{- $override := and $root.Values.httpRoute.listenerSet.clusterIssuer (eq $group "cert-manager.io") (eq $kind "ClusterIssuer") (eq $name $root.Values.httpRoute.listenerSet.clusterIssuer) -}}
{{- if not (or $builtin $external $override) -}}
{{- fail "existing Certificate issuerRef is not a supported renewal owner" -}}
{{- end -}}
{{- $issuer = dict "group" $group "kind" $kind "name" $name -}}
{{- end -}}
{{- toYaml $issuer -}}
{{- end -}}
