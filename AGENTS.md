# AGENTS.md

Context for AI agents (code review, coding assistants) working in this repository.

## What this is

A web UI for [FirecREST v2](https://eth-cscs.github.io/firecrest-v2/), a REST API for
interacting with HPC resources (schedulers, filesystems, job execution, accounting). This
app is the browser-facing client: dashboard, job submission/monitoring, and a file manager
with upload/download.

## Stack

- **Framework**: Remix v2 (`@remix-run/*`), served via a custom Express `server.js`, not the
  Remix dev/prod server directly.
- **Language**: TypeScript, strict-ish; some `any` remains in older code, don't treat that as
  license to add more.
- **Styling**: Tailwind CSS. Some components are Tailwind UI-derived — see the README's
  license notice before copying UI patterns wholesale.
- **Auth**: `remix-auth` against an external OIDC/OAuth2-compliant identity provider. Don't
  assume a specific IdP vendor in code or comments — the app is meant to work against any
  standards-compliant provider.
- **Logging**: `pino`, emitting ECS (Elastic Common Schema)-shaped JSON — dotted field names
  like `event.action`, `http.request.method`, `firecrest.*` for app-specific fields. See
  `app/logger/logger.server.ts` and `app/helpers/log-helper.ts`.
- **Package manager**: Yarn 4 (Berry), managed via Corepack — don't use `npm`.

## Repo layout

- `app/routes/` — Remix flat-file routing convention (`_app.compute.systems.$systemName...tsx`
  style file names encode the URL path and layout nesting; not a folder-per-route layout).
- `app/apis/` — typed wrappers around FirecREST v2 backend calls, one file per API domain
  (`compute-api.ts`, `filesystem-api.ts`, `status-api.ts`).
- `app/modules/` — feature-specific components, grouped by domain (`compute/`, `filesystem/`,
  `status/`, `dashboard/`), each typically split into `components/`, `helpers/`.
- `app/helpers/` — cross-cutting utilities (logging, error/response shaping, formatting).
- `app/components/` — generic, domain-agnostic UI building blocks.
- `app/contexts/` — React context providers for cross-component state (auth, groups,
  maintenance banner, etc.).
- `deploy/` — Dockerfile and Helm chart for deployment.

## Conventions worth knowing before flagging something as wrong

- **No semicolons** — Prettier is configured with `semi: false`. Don't flag missing semicolons
  as a style issue.
- **Single quotes, no trailing commas removed** — `singleQuote: true`, `trailingComma: 'all'`.
- Every source file requires an exact copyright/license header (checked by
  `yarn run check-licence`, not just linted) — see any existing file for the exact block.
- Backend API response fields are typically `camelCase` over the wire (backend uses a
  camelCase alias generator), matched 1:1 by the TypeScript types in `app/types/`.

## Checks to run / expect CI to run

- `yarn lint` — ESLint over `app/**/*.{js,jsx,ts,tsx}`.
- `yarn typecheck` — `tsc`, no emit.
- `yarn test` — Jest.
- `yarn run check-licence` — license header verification (separate from lint).
- `yarn build` — must succeed; this is a real build via `remix vite:build`, not just a
  syntax check.

## Things not to suggest without strong justification

- Don't suggest switching package managers, bundlers, or the Express-based `server.js` to the
  framework's default server — both are deliberate choices tied to how this app is deployed
  and how auth/session/OIDC-discovery gating works at startup.
- Don't suggest renaming or restructuring the flat-file route naming convention — it's a
  Remix/React Router convention, not an accident.
