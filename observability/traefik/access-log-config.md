# Traefik Access Log Configuration — Reference Only

> **DO NOT apply to production.**
> This document records how Traefik access logs and request-ID propagation *could* be configured
> to complement the application-level latency instrumentation. It is a reference for future
> platform decisions, not an operational change.

---

## Why this matters

When the Remix UI logs a slow session read or OIDC call the timestamp is relative to when the
Node process handled the request. Traefik sits in front and already sees the full round-trip time
(from TLS termination through response completion). Adding Traefik access logs with:

1. `x-request-id` correlation
2. `requestDuration` (total time at the ingress)

lets you compare the ingress-level duration with the sum of component durations logged by the app.
If `requestDuration` >> sum of app timings, the gap points to network or buffering overhead inside
the cluster (e.g. Traefik → pod TCP setup, response buffering before streaming to the client).

---

## Traefik static configuration additions

```yaml
# traefik.yaml (or equivalent Helm values section)
accessLog:
  # Write to stdout so the log collector picks it up alongside the app logs
  filePath: ""            # empty → stdout
  format: json

  fields:
    defaultMode: keep
    names:
      # Include these specific fields; drop everything else if bandwidth matters
      StartUTC: keep
      Duration: keep       # total request duration in nanoseconds
      RequestMethod: keep
      RequestPath: keep
      RequestProtocol: keep
      OriginStatus: keep
      OriginDuration: keep # time waiting for the backend (pod) only

    headers:
      defaultMode: drop
      names:
        # Echo the x-request-id header so logs from Traefik and the app share a key
        X-Request-Id: keep
        X-Forwarded-For: keep
```

### Helm values equivalent (Traefik chart)

```yaml
additionalArguments:
  - "--accesslog=true"
  - "--accesslog.format=json"
  - "--accesslog.fields.defaultmode=keep"
  - "--accesslog.fields.headers.defaultmode=drop"
  - "--accesslog.fields.headers.names.X-Request-Id=keep"
  - "--accesslog.fields.headers.names.X-Forwarded-For=keep"
```

---

## x-request-id propagation in dynamic config

Traefik does **not** auto-generate `x-request-id` by default. A middleware is needed:

```yaml
# traefik dynamic config / IngressRoute CRD
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: requestid
  namespace: firecrest
spec:
  headers:
    customRequestHeaders:
      # Generate a UUID if the header is absent; pass through if already set by the client
      X-Request-Id: ""   # empty string → Traefik generates a random value only if missing

# Attach to IngressRoute:
# routes:
#   - middlewares:
#       - name: requestid
```

> **Note**: The exact header-generation behaviour depends on the Traefik version. As of v3.x,
> Traefik does not natively generate UUIDs for missing headers — this requires the
> `plugin/requestid` community plugin or a dedicated middleware. Verify against the deployed
> version before proposing this change.

---

## Resulting Kibana correlation query

Once Traefik access logs land in Elastic alongside app logs (same index or aliased), a single
query returns the full picture per request:

```kql
X-Request-Id: "<uuid>" OR http.request.id: "<uuid>"
```

The Traefik entry shows ingress-level `Duration`; the app entries show component-level durations.
The delta between `Duration` and the sum of `session.read + oidc.* + api.*` durations reveals
where time is actually spent outside the application.

---

## ECS field mapping for Traefik access logs

If using Filebeat / Elastic Agent with the Traefik module, the JSON fields map as follows:

| Traefik JSON field | ECS field |
|---|---|
| `Duration` | `event.duration` (ns) |
| `StartUTC` | `@timestamp` |
| `RequestMethod` | `http.request.method` |
| `RequestPath` | `url.path` |
| `OriginStatus` | `http.response.status_code` |
| `X-Request-Id` (header) | `http.request.id` |

Configure the Filebeat pipeline to populate these mappings so Traefik and app log entries share
the same field names in Kibana.
