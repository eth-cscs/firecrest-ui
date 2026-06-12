#!/usr/bin/env bash
# Generates an environment-specific Grafana dashboard from the template.
#
# Usage:
#   ./generate-dashboard.sh <env-file>
#
# Example:
#   ./generate-dashboard.sh grafana.env.tds
#
# Required variables in the env file (see grafana.env.example):
#   DATASOURCE_UID   — UID of the Elasticsearch datasource in Grafana
#   ENV_TITLE        — Display label used in the dashboard title (e.g. TDS, Prod)
#   DASHBOARD_UID    — Unique Grafana dashboard UID (e.g. firecrest-ui-observability-tds)
#
# Output:
#   observability/grafana/local/<env-slug>/firecrest-ui-observability.json
#   (gitignored — safe to commit this script and the template, not the output)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE="$SCRIPT_DIR/firecrest-ui-observability.template.json"

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <env-file>"
  exit 1
fi

ENV_FILE="$1"
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: env file '$ENV_FILE' not found"
  exit 1
fi

if [ ! -f "$TEMPLATE" ]; then
  echo "Error: template not found at $TEMPLATE"
  exit 1
fi

# Load variables from the env file (ignore comments and blank lines)
while IFS='=' read -r key value; do
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
  export "$key"="$value"
done < "$ENV_FILE"

# Validate required variables
for var in DATASOURCE_UID ENV_TITLE DASHBOARD_UID; do
  if [ -z "${!var:-}" ]; then
    echo "Error: $var is not set in $ENV_FILE"
    exit 1
  fi
done

ENV_SLUG="$(echo "$ENV_TITLE" | tr '[:upper:]' '[:lower:]')"
OUTPUT_DIR="$SCRIPT_DIR/local/$ENV_SLUG"
OUTPUT="$OUTPUT_DIR/firecrest-ui-observability.json"

mkdir -p "$OUTPUT_DIR"

sed \
  -e "s/__DATASOURCE_UID__/$DATASOURCE_UID/g" \
  -e "s/__ENV_TITLE__/$ENV_TITLE/g" \
  -e "s/__DASHBOARD_UID__/$DASHBOARD_UID/g" \
  "$TEMPLATE" > "$OUTPUT"

echo "Generated: $OUTPUT"
