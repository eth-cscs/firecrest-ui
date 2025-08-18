/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import express from 'express'
import pino from 'pino'
import { createRequestHandler } from '@remix-run/express'

const logger = pino({ level: process.env.LOGGING_LEVEL || 'info' })

const isProd = process.env.NODE_ENV === 'production'

const app = express()
app.disable('x-powered-by')

// In production, serve /assets (Remix client build) and anything in /public
if (isProd) {
  app.use('/assets', express.static('build/client', { immutable: true, maxAge: '1y' }))
  app.use(express.static('public', { maxAge: '1h' }))
}

let vite // only used in dev
if (!isProd) {
  vite = await import('vite').then(({ createServer }) =>
    createServer({
      server: { middlewareMode: true },
    }),
  )

  // Vite must be before your Remix handler
  app.use(vite.middlewares)
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
  app.use(viteDevServer.middlewares)
}

// Remix handler
app.all(
  '*',
  isProd
    ? createRequestHandler({
        // built server bundle from `remix vite build`
        build: await import('./build/server/index.js'),
        mode: process.env.NODE_ENV,
        getLoadContext(_req, _res) {
          // return whatever you need in loaders/actions
          return {}
        },
      })
    : async (req, res, next) => {
        try {
          // fresh build on every request in dev
          const build = await vite.ssrLoadModule('virtual:remix/server-build')
          return createRequestHandler({
            build,
            mode: 'development',
            getLoadContext(_req, _res) {
              return {}
            },
          })(req, res, next)
        } catch (err) {
          // Let Vite fix stack traces for better DX
          vite && vite.ssrFixStacktrace && vite.ssrFixStacktrace(err)
          next(err)
        }
      },
)

const port = Number(process.env.PORT || 3000)
app.listen(port, () => {
  logger.info(`App listening on http://localhost:${port}`)
})
