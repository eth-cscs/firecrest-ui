import pino from 'pino'
import express from 'express'
import { createRequestHandler } from '@remix-run/express'
import { wrapExpressCreateRequestHandler } from '@sentry/remix'

const getLoggingLevel = () => {
  return process.env.LOGGING_LEVEL || 'info'
}

pino({
  level: getLoggingLevel(),
})

const sentryCreateRequestHandler = wrapExpressCreateRequestHandler(createRequestHandler)

const viteDevServer =
  process.env.NODE_ENV === 'production'
    ? null
    : await import('vite').then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        }),
      )

const app = express()
app.use(viteDevServer ? viteDevServer.middlewares : express.static('build/client'))

const build = viteDevServer
  ? () => viteDevServer.ssrLoadModule('virtual:remix/server-build')
  : await import('./build/server/index.js')

app.all('*', sentryCreateRequestHandler({ build }))

app.listen(3000, () => {
  console.log('App listening on http://localhost:3000')
})
