#!/bin/sh
# Vérifie le chart Helm : lint, rendu pour chaque fichier de valeurs, schémas Kubernetes, et deux règles du projet.
# Usage : pnpm helm:check (utilise Docker, mêmes images en local et en CI).
set -eu
cd "$(dirname "$0")"
HELM=alpine/helm:3.16.3
KUBECONFORM=ghcr.io/yannh/kubeconform:v0.6.7
run() { docker run --rm -v "$PWD:/c" -w /c "$@"; }

run "$HELM" lint new-start
for values in "" $(ls new-start/values-*.yaml 2>/dev/null); do
  out=$(run "$HELM" template ns new-start ${values:+-f "$values"})
  echo "$out" | docker run --rm -i "$KUBECONFORM" -strict -summary -schema-location default -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' -
  echo "$out" | grep -q 'maxUnavailable: 0' || { echo "maxUnavailable: 0 manquant"; exit 1; }
  if echo "$out" | grep -Eqi '(password|secret|api_?key):[[:space:]]+[^ ]'; then
    echo "un secret semble écrit en clair dans le rendu"; exit 1
  fi
done
echo "chart OK"
