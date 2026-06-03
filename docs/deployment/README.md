# FirecREST Web UI Deployment with Helm

## Overview

This documentation provides step-by-step instructions for deploying the FirecREST Web UI using Helm on Kubernetes. The chart allows for flexible configuration using environment variables and supports custom branding, including logo customization.

## Prerequisites

* Helm 3 installed on your local machine
* Kubernetes cluster with appropriate access
* A Kubernetes Secret named `firecrest-web-ui-v2` with the following keys:
  * `session-secret` — a random secret used to sign session cookies
  * `oidc-client-id` — the OIDC client ID
  * `oidc-client-secret` — the OIDC client secret
  * `redis-auth-password` — the Redis authentication password
* ConfigMap for the custom logo (if enabled)

To create the secret:

```bash
kubectl create secret generic firecrest-web-ui-v2 \
  --from-literal=session-secret=<random-secret> \
  --from-literal=oidc-client-id=<client-id> \
  --from-literal=oidc-client-secret=<client-secret> \
  --from-literal=redis-auth-password=<redis-password>
```

---

## Installation Steps

### 1. Add Helm Repository for FirecREST UI

Since the FirecREST Web UI is published as a Helm chart on GitHub, you can add it directly as a dependency:

```yaml
dependencies:
  - name: firecrest-web-ui-v2
    version: <version>
    repository: https://eth-cscs.github.io/firecrest-ui/helm/
```

To add the Helm repository manually:

```bash
helm repo add firecrest-ui https://eth-cscs.github.io/firecrest-ui/helm/
helm repo update
```

### 2. Clone the Helm Chart Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 3. Update Values File (values.yaml)

Customize the deployment by editing the `values.yaml` file. Below are the most common configurations:

```yaml
global:
  environment: "production"
  dns:
    webUI: "webui.example.com"

replicas: 2
image: "ghcr.io/eth-cscs/firecrest-ui"
loggingLevel: "info"

companyName: "MyCompany"
appName: "MyPlatform"
customLogo: false
customLogoVolume: "/usr/server/app/public/custom/logo.svg"
customLogoPath: "./custom/logo.svg"

# OIDC settings — configure with your identity provider's issuer URL.
# The application will automatically discover all endpoints (authorization,
# token, userinfo, end_session) from {oidcIssuerUrl}/.well-known/openid-configuration.
oidcIssuerUrl: "https://auth.example.com/auth/realms/myrealm"
oidcCallbackUrl: "https://webui.example.com/auth/callback"
oidcPostLogoutRedirectUrl: "https://webui.example.com/logout"

firecrestApiBaseUrl: "https://api.example.com"

redisActive: "true"
redisHost: "redis-master"

supportUrl: "https://support.example.com"
docUrl: "https://docs.example.com"
repoUrl: "https://github.com/example/repo"

# Optional: URL of an observability/monitoring dashboard to link from the UI
uiObservabilityDashboard: ""

# Observability settings
platform: "my-platform"  # optional — logical name of the deployment platform (e.g. 'stp', 'prod')
```

### File upload and download limits

Upload and download size limits are **not configured in the UI**. They are read at runtime from the `max_ops_file_size` field returned by the FirecREST backend for each system. Make sure your ingress `proxy-body-size` (or equivalent) is set to at least the backend limit plus some overhead for multipart framing — e.g. if the backend allows 5 MB, set the ingress limit to `6m`.

### 4. Deploy the Helm Chart

```bash
helm upgrade --install firecrest ./chart --values values.yaml
```

### 5. Verify the Deployment

```bash
kubectl get deployments
kubectl get pods -l app=firecrest-web-ui
```

---

## OIDC Configuration

The FirecREST UI uses standard OpenID Connect (OIDC) for authentication and supports any OIDC-compliant identity provider (Keycloak, Auth0, Microsoft Entra ID, Dex, etc.).

### Required environment variables

| Variable | Description |
|---|---|
| `OIDC_ISSUER_URL` | Full issuer URL of your OIDC provider (e.g. `https://auth.example.com/auth/realms/myrealm`). All endpoints are discovered automatically from `{issuerUrl}/.well-known/openid-configuration`. |
| `OIDC_CLIENT_ID` | OAuth2 client ID registered with your identity provider. |
| `OIDC_CLIENT_SECRET` | OAuth2 client secret. |
| `OIDC_CALLBACK_URL` | Redirect URI registered with your identity provider — must be `https://<your-ui-host>/auth/callback`. |
| `OIDC_POST_LOGOUT_REDIRECT_URL` | URL to redirect to after logout (typically your UI's root URL). |

### Required OAuth2 client configuration

Register a **confidential** OAuth2 client in your identity provider with:
- **Grant type**: Authorization Code
- **Redirect URI**: `https://<your-ui-host>/auth/callback`
- **Scopes**: `openid`, `profile`, `email`

The `preferred_username`, `given_name`, `family_name`, and `email` claims must be included in the userinfo response.

---

## Custom Logo Configuration

To enable a custom logo:

1. Update `values.yaml` to enable branding:

```yaml
customLogo: true
customLogoVolume: "/usr/server/app/public/custom/logo.svg"
customLogoPath: "./custom/logo.svg"
```

2. Create the ConfigMap with the custom logo:

In this example we provide the FirecREST svg logo.
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: firecrest-logo
  namespace: default
data:
  logo.svg: |
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.45 125.91" width="100" height="100">
      <defs>
        <style>
          .cls-2 {
            fill: #7a7a7a;
          }
        </style>
      </defs>
      <path
        d="M2.38 61.642L23.177 40.846l20.796 20.796-20.796 20.796zM.05 105.38l20.8-20.79-20.8-20.8v41.59zM98.86 96.5H69.45v29.41L98.86 96.5zM67.66 93.34l27.48-27.48 27.49 27.48H67.66zM66.38 125.67l-41-41 41-41v82zM127.45 29.03H69.47v57.98l57.98-57.98z"
        class="cls-2"
      />
      <path
        d="M31.03 0L0 30.64l.08 28.71 30.89-30.48L31.03 0z"
        style="fill: #ec671a;"
      />
    </svg>
```

### Conditional Logo Mounting

In the `deployment.yaml`, make sure to conditionally include the volume and volumeMount only when the custom logo flag is set:

```yaml
{{- if .Values.customLogo }}
volumeMounts:
  - name: logo-volume
    mountPath: {{ .Values.customLogoVolume }}
    subPath: logo.svg
{{- end }}

{{- if .Values.customLogo }}
volumes:
  - name: logo-volume
    configMap:
      name: firecrest-logo
{{- end }}
```

---

## Accessing the Application

Once deployed, access the application via the configured hostname:

```
http://webui.example.com
```

---

## Troubleshooting

* Check logs if the deployment fails:

```bash
kubectl logs -l app=firecrest-web-ui
```

* Validate environment variables:

```bash
kubectl describe pod -l app=firecrest-web-ui
```

## Cleanup

To uninstall the Helm chart:

```bash
helm uninstall firecrest
```

---

## Observability

The FirecREST UI emits structured JSON logs in [Elastic Common Schema (ECS)](https://www.elastic.co/guide/en/ecs/current/index.html) format, suitable for ingestion by Filebeat and storage in Elasticsearch.

### Structured log fields

Every log line includes the following fields:

| Field | Description |
|---|---|
| `log.level` | Log level (`info`, `warn`, `error`, `debug`) |
| `message` | Human-readable description of the event |
| `event.action` | Machine-readable event identifier (e.g. `fs.chmod`, `compute.job.submit.local`) |
| `@timestamp` | ISO-8601 timestamp |
| `service.name` | Always `firecrest-web-ui` |
| `service.version` | Application version |
| `service.environment` | Value of the `ENVIRONMENT` variable |
| `host.name` | Pod hostname |
| `user.id` | Authenticated username (present on all requests after login) |
| `request.id` | Request correlation ID from the `x-request-id` header |
| `http.request.method` | HTTP method |
| `url.path` | Request path |
| `firecrest.system` | HPC system name targeted by the request |
| `firecrest.account` | HPC account used (compute routes only) |
| `firecrest.jobId` | Job ID returned by a submission (compute submit only) |
| `firecrest.platform` | Platform name, if `PLATFORM` is set (see below) |

### Platform label

The optional `PLATFORM` environment variable sets the `firecrest.platform` field on every log line. Use it to distinguish logs from different deployment platforms (e.g. `stp`, `prod`) when multiple instances share the same Elasticsearch cluster.

Set it via `values.yaml`:

```yaml
platform: "stp"
```

When unset (default), the field is omitted from logs.

### Elasticsearch data stream routing

When using Filebeat with the `co.elastic.logs` pod annotations (included in the Helm chart), logs are routed to a dedicated data stream with:

* **dataset**: `<environment>.firecrest` — e.g. `tds.firecrest` or `prod.firecrest`
* **namespace**: `firecrest-ui` (fixed)

This results in an index name of the form `.ds-logs-<environment>.firecrest-firecrest-ui-<date>-NNNNNN`.

The namespace is fixed so that Grafana dashboard queries can use `data_stream.namespace:"firecrest-ui"` as a stable filter across all environments.

### Grafana dashboard link

Set `uiObservabilityDashboard` to a Grafana panel URL to expose a direct link to the monitoring dashboard from within the UI:

```yaml
uiObservabilityDashboard: "https://grafana.example.com/d/abc123/firecrest-ui"
```

---

## Session Store for Multiple Replicas

When deploying with more than one replica (`replicas > 1`), a shared session store must be configured. Without it, users will lose their session when requests are routed to different replicas.

Set `redisActive: "true"` and point `redisHost` to a Valkey (or Redis) instance. A minimal example using the [Bitnami Valkey Helm chart](https://charts.bitnami.com/bitnami) as a dependency:

`Chart.yaml`:
```yaml
dependencies:
  - name: valkey
    version: 5.4.9
    repository: https://charts.bitnami.com/bitnami
```

`values.yaml`:
```yaml
global:
  security:
    allowInsecureImages: true  # required when using a non-Bitnami image

firecrest-web-ui-v2:
  replicas: 2
  redisActive: "true"
  redisHost: "<release-name>-valkey-primary"

valkey:
  image:
    registry: docker.io
    repository: valkey/valkey
    tag: 8.1.6
  architecture: standalone
  auth:
    existingSecret: <secret-name>
    existingSecretPasswordKey: <password-key>
  primary:
    persistence:
      enabled: false
```

> **Note:** The official [valkey/valkey](https://hub.docker.com/r/valkey/valkey) image is used here as it provides versioned tags. The `allowInsecureImages` flag is required by the Bitnami chart when using a non-Bitnami image.
