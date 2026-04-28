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
fileUploadLimit: "5242880"  # bytes (5MB)

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
```

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
