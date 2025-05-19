/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { json } from '@remix-run/node'
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node'
import {
  Meta,
  Links,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from '@remix-run/react'
import { captureRemixErrorBoundaryError } from '@sentry/remix'
// styles
import stylesheet from '~/tailwind.css?url'
// configs
import base from './configs/base.config'
import sentry from './configs/sentry.config'
// pages
import ErrorPage from './components/pages/ErrorPage'
import logger from './logger/logger'

export async function loader({ context }: LoaderFunctionArgs) {
  return json({
    nonce: context.nonce as string,
    appName: base.appName,
    ENV: {
      APP_NAME: base.appName,
      APP_VERSION: base.appVersion,
      ENVIRONMENT: base.environment,
      SENTRY_ACTIVE: sentry.active,
      SENTRY_DSN: sentry.dsn,
      SENTRY_DEBUG: sentry.debug,
      SENTRY_TRACES_SAMPLE_RATE: sentry.tracesSampleRate,
    },
  })
}

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'icon', type: 'image/svg+xml', href: base.logoPath },
  { rel: 'icon', type: 'image/png', href: base.logoPath },
]

function Document({
  children,
  nonce,
  title,
}: {
  children: React.ReactNode
  title?: string
  nonce?: string
}) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <title>{title}</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  )
}

export default function App() {
  const data = useLoaderData<typeof loader>()
  const { nonce, appName } = data
  return (
    <Document nonce={nonce} title={appName}>
      <Outlet />
      <script
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
        }}
      />
    </Document>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  captureRemixErrorBoundaryError(error)
  return (
    <Document title='FirecREST Web UI - v2'>
      <ErrorPage />
    </Document>
  )
}
