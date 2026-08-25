/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { randomUUID } from 'crypto'
import express from 'express'
import pino from 'pino'
import { createRequestHandler } from '@react-router/express'
import dotenv from 'dotenv'

const isProd = process.env.NODE_ENV === 'production'

if (!isProd) {
  dotenv.config({ path: `.env`, override: true })
}

// ECS-shaped, matching app/logger/logger.server.ts - server.js runs as plain Node
// (no Vite/TS transform), so it can't import that file directly and mirrors its config
// instead. Kept consistent so this log stream joins the same Kibana/Grafana queries.
const logger = pino({
  level: process.env.LOGGING_LEVEL || 'info',
  messageKey: 'message',
  timestamp: () => `,"@timestamp":"${new Date().toISOString()}"`,
  base: {
    'service.name': process.env.SERVICE_NAME || 'firecrest-web-ui',
    'service.version': process.env.APP_VERSION || 'unknown',
    'service.environment': process.env.ENVIRONMENT || 'development',
    ...(process.env.PLATFORM ? { 'firecrest.platform': process.env.PLATFORM } : {}),
  },
  formatters: {
    level: (label) => ({ 'log.level': label }),
    bindings: ({ pid, hostname, ...rest }) => ({ ...rest, 'host.name': hostname }),
  },
})

// Logs every outbound call that carries our tracing headers (i.e. went through
// withTracingHeaders() in api.ts) so its request.id/correlationId can be joined against
// the matching firecrest-v2 (and, once hpc-ssh accepts X-Correlation-ID, hpc-ssh) log
// lines for cross-service troubleshooting. A lightweight custom stand-in for real
// distributed tracing until a proper tracing backend exists. Wrapping fetch here, rather
// than logging inside api.ts, is what keeps this out of the client bundle: api.ts and
// the *-api.ts modules are also imported by browser components, so they can't import a
// server-only logger, but server.js is a plain Node entrypoint never processed by Vite.
const originalFetch = global.fetch
global.fetch = (input, init) => {
  const headers = init?.headers ?? {}
  const requestId = headers['X-Request-ID'] ?? headers['x-request-id']
  if (requestId) {
    logger.info({
      message: 'Outbound backend request',
      'event.action': 'api.request',
      'request.id': requestId,
      'firecrest.correlationId': headers['X-Correlation-ID'] ?? headers['x-correlation-id'],
      'http.request.method': init?.method ?? 'GET',
      'url.path': typeof input === 'string' ? input : input?.url,
    })
  }
  return originalFetch(input, init)
}

const app = express()
app.disable('x-powered-by')

let vite // only used in dev
if (!isProd) {
  vite = await import('vite').then(({ createServer }) =>
    createServer({
      server: { middlewareMode: true },
    }),
  )
}

if (isProd) {
  // Serve the hashed assets exactly at /assets/*
  app.use(
    '/assets',
    express.static('build/client/assets', {
      immutable: true,
      maxAge: '1y',
    }),
  )

  // Serve things you ship in /public at the root
  app.use(express.static('public', { maxAge: '1h' }))
} else {
  // dev: Vite middleware first
  app.use(vite.middlewares)
}

// Assign X-Correlation-ID to every request - a single id identifying this whole
// browser-originated request end-to-end (firecrest-ui -> firecrest-v2 -> hpc-ssh),
// even across the multiple backend calls one page load can fan out into. Respects
// an upstream value if already set instead of always minting a fresh one. Per-hop
// X-Request-ID is minted separately, per outbound call, in api.ts.
app.use((req, _res, next) => {
  req.headers['x-correlation-id'] ??= randomUUID()
  next()
})

// React Router handler
app.all(
  '*',
  isProd
    ? createRequestHandler({
        // built server bundle from `react-router build`
        build: await import('./build/server/index.js'),
        mode: process.env.NODE_ENV,
      })
    : async (req, res, next) => {
        try {
          // fresh build on every request in dev
          const build = await vite.ssrLoadModule('virtual:react-router/server-build')
          return createRequestHandler({
            build,
            mode: 'development',
          })(req, res, next)
        } catch (err) {
          // Let Vite fix stack traces for better DX
          vite && vite.ssrFixStacktrace && vite.ssrFixStacktrace(err)
          next(err)
        }
      },
)

// Verify OIDC provider is reachable before accepting requests
const oidcIssuerUrl = process.env.OIDC_ISSUER_URL
if (!oidcIssuerUrl) {
  logger.error('OIDC_ISSUER_URL is not configured — halting')
  process.exit(1)
}
try {
  const res = await fetch(`${oidcIssuerUrl}/.well-known/openid-configuration`)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  logger.info(`OIDC discovery verified (${oidcIssuerUrl})`)
} catch (err) {
  logger.error(
    { err },
    `OIDC discovery failed for ${oidcIssuerUrl} — check OIDC_ISSUER_URL and provider availability. Halting.`,
  )
  process.exit(1)
}

const port = Number(process.env.PORT || 3000)
app.listen(port, () => {
  logger.info(`App listening on http://localhost:${port}`)
})
