# Kibana / Elastic Latency Queries

All queries target the ECS-structured logs emitted by the Remix app (pino + ECS format).
Fields of interest: `event.action`, `event.duration` (nanoseconds), `component`, `message`,
`http.request.id` (x-request-id), `log.level`.

---

## 1. Session (Valkey) latency

### Slow session operations (>500 ms)

```kql
component: "valkey" AND log.level: "warn" AND message: "Slow session*"
```

Columns to add: `@timestamp`, `event.action`, `event.duration`, `message`, `http.request.id`

### Session latency histogram (all reads)

```kql
event.action: "session.read"
```

Use a **Lens → Histogram** visualization with `event.duration` (convert ns → ms: divide by 1e6 in a
runtime field or set the unit in the axis label). Group by `event.action` to compare `session.read`,
`session.commit`, and `session.destroy` side by side.

### Valkey connection events (errors / reconnects)

```kql
component: "valkey" AND (log.level: "error" OR log.level: "warn")
```

Useful to correlate Valkey reconnect cycles with spikes in session latency. Pin a vertical marker
on the session latency chart when reconnect events appear.

---

## 2. OIDC / Keycloak latency

### Slow OIDC calls (>1 000 ms)

```kql
component: "oidc" AND log.level: "warn" AND message: "Slow oidc*"
```

### All OIDC durations by action

```kql
component: "oidc"
```

Split by `event.action` to compare `oidc.discovery`, `oidc.userinfo`, and `oidc.token_refresh`.
A **Line** chart with a 95th-percentile aggregation on `event.duration` catches tail latency.

### Token refresh frequency

```kql
event.action: "oidc.token_refresh"
```

High frequency here relative to unique users indicates short-lived tokens or clock skew between
the UI server and Keycloak.

---

## 3. Backend API (FirecREST) latency

### All FirecREST calls with duration

```kql
component: "firecrest"
```

### Slow calls (>2 s, promoted to warn)

```kql
component: "firecrest" AND log.level: "warn"
```

### `/nodes` endpoint latency (dashboard bottleneck)

```kql
url.path: *nodes* AND component: "firecrest"
```

The `/v2/status/{system}/nodes` endpoints are the primary dashboard bottleneck (one deferred
promise per system). This query tracks their p50/p95 over time.

---

## 4. End-to-end request duration by page

### Dashboard index page load time

```kql
event.action: "http.response" AND url.path: "/"
```

Columns: `@timestamp`, `event.duration`, `http.request.id`, `http.response.status_code`

### Correlate all events for a single request

```kql
http.request.id: "<paste x-request-id here>"
```

This pulls every log line (session read, OIDC check, API call, response) that shared the same
`x-request-id`, reconstructing a per-request trace from structured logs.

---

## 5. Composite: session + OIDC + API for the same request

```kql
http.request.id: "<paste x-request-id here>" AND component: ("valkey" OR "oidc" OR "firecrest")
```

Sort by `@timestamp` ascending to see the waterfall: session.read → oidc check → API call(s).

---

## 6. Alert thresholds (suggested)

| Metric | KQL filter | Threshold | Severity |
|---|---|---|---|
| Slow Valkey read | `event.action: "session.read"` | p95 > 300 ms | warning |
| Valkey error rate | `component: "valkey" AND log.level: "error"` | >5 / min | critical |
| OIDC discovery slow | `event.action: "oidc.discovery"` | any > 2 000 ms | warning |
| Token refresh fail | `event.action: "oidc.token_refresh" AND log.level: "error"` | any | critical |
| API timeout | `event.duration > 9000000000 AND component: "api"` | any | warning |

---

## Notes

- `event.duration` is stored in **nanoseconds** (ECS spec). Divide by `1e6` for milliseconds.
- Set `@timestamp` as the primary time field.
- The `http.request.id` field is populated from the `x-request-id` header threaded through all
  server-side log calls. It is the primary correlation key across session, OIDC, and API layers.
