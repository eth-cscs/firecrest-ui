/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import {
  Meta,
  Links,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from 'react-router'
import type { LinksFunction } from 'react-router'
// styles
import stylesheet from '~/tailwind.css?url'
// configs
import base from './configs/base.config'
// pages
import ErrorPage from './components/pages/ErrorPage'

export async function loader() {
  return {
    appName: base.appName,
    logoPath: base.logoPath,
    statusUrl: base.statusUrl,
    ENV: {
      APP_NAME: base.appName,
      APP_VERSION: base.appVersion,
      ENVIRONMENT: base.environment,
    },
  }
}

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'icon', type: 'image/svg+xml', href: base.logoPath },
  { rel: 'icon', type: 'image/png', href: base.logoPath },
]

function Document({ children, title }: { children: React.ReactNode; title?: string }) {
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
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const data = useLoaderData<typeof loader>()
  const { appName } = data
  return (
    <Document title={appName}>
      <Outlet />
      <script
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
  console.error(error)
  return (
    <Document title='FirecREST Web UI - v2'>
      <ErrorPage />
    </Document>
  )
}
