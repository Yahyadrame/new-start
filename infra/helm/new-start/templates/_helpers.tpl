{{- define "ns.image" -}}
{{ .root.Values.image.registry }}/newstart-{{ .app }}:{{ .root.Values.image.tag | default .root.Chart.AppVersion }}
{{- end -}}

{{- define "ns.labels" -}}
app.kubernetes.io/name: {{ .app }}
app.kubernetes.io/part-of: new-start
app.kubernetes.io/managed-by: {{ .root.Release.Service }}
{{- end -}}

{{- define "ns.securityContext" -}}
runAsNonRoot: true
runAsUser: 1000
seccompProfile:
  type: RuntimeDefault
{{- end -}}

{{- define "ns.containerSecurityContext" -}}
allowPrivilegeEscalation: false
capabilities:
  drop: [ALL]
{{- end -}}
