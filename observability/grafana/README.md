# Grafana Dashboards

Environment-specific dashboards are generated from a shared template using a small
bash script. Generated files and environment config files are gitignored — only the
template, the script, and the example env file are committed.

## Generating a dashboard

**1. Create an env file for your environment** by copying the example:

```bash
cp grafana.env.example grafana.env.<env>   # e.g. grafana.env.prod
```

**2. Fill in the values:**

| Variable | Description |
|---|---|
| `DATASOURCE_UID` | UID of the Elasticsearch datasource in Grafana. Find it under Connections → Data sources → your datasource (visible in the browser URL). |
| `ENV_TITLE` | Display label in the dashboard title, e.g. `TDS`, `Prod`. |
| `DASHBOARD_UID` | Unique Grafana dashboard UID, e.g. `firecrest-ui-observability-prod`. Must be unique per environment if both dashboards live in the same Grafana instance. |

**3. Run the script:**

```bash
./generate-dashboard.sh grafana.env.<env>
```

The dashboard is written to `local/<env>/firecrest-ui-observability.json`.

**4. Import into Grafana:**

Grafana → Dashboards → Import → upload the generated JSON file.

## File layout

```
observability/grafana/
  firecrest-ui-observability.template.json  # base template (committed)
  generate-dashboard.sh                      # generation script (committed)
  grafana.env.example                        # documents required variables (committed)
  grafana.env.<env>                          # your env config (gitignored)
  local/<env>/firecrest-ui-observability.json  # generated output (gitignored)
```
