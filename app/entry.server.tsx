import * as Sentry from '@sentry/remix'
import { PassThrough } from 'node:stream'
import { isbot } from 'isbot'
import { RemixServer } from '@remix-run/react'
import { renderToPipeableStream } from 'react-dom/server'
import { createReadableStreamFromReadable } from '@remix-run/node'
import type { AppLoadContext, EntryContext } from '@remix-run/node'
// configs
import base from './configs/base.config'
import sentry from './configs/sentry.config'

export function handleError(error: any, { request }: any) {
  Sentry.captureRemixServerException(error, 'remix.server', request)
}

// Sentry initialization
if (sentry.active) {
  Sentry.init({
    dsn: sentry.dsn,
    debug: sentry.debug,
    environment: base.environment,
    release: base.appVersion,
    tracesSampleRate: parseFloat(sentry.tracesSampleRate),
  })
}

const ABORT_DELAY = 5_000

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: AppLoadContext,
) {
  return isbot(request.headers.get('user-agent') || '')
    ? handleBotRequest(request, responseStatusCode, responseHeaders, remixContext)
    : handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext)
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
      {
        onAllReady() {
          shellRendered = true
          const body = new PassThrough()
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set('Content-Type', 'text/html')

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          )

          pipe(body)
        },
        onShellError(error: unknown) {
          reject(error)
        },
        onError(error: unknown) {
          responseStatusCode = 500
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error)
          }
        },
      },
    )

    setTimeout(abort, ABORT_DELAY)
  })
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
      {
        onShellReady() {
          shellRendered = true
          const body = new PassThrough()
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set('Content-Type', 'text/html')

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          )

          pipe(body)
        },
        onShellError(error: unknown) {
          reject(error)
        },
        onError(error: unknown) {
          responseStatusCode = 500
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error)
          }
        },
      },
    )

    setTimeout(abort, ABORT_DELAY)
  })
}
