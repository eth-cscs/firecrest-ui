/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { Suspense } from 'react'
import { useLoaderData, useRouteError, Await } from '@remix-run/react'
import { data } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'
// loggers
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { LogPage } from '~/helpers/log-labels'
import { promiseWithTimeout, DEFERRED_PROMISE_TIMEOUT_MS } from '~/helpers/promise-helper'
// utils
import { requireAuth, getAuthAccessToken } from '~/utils/auth.server'
// contexts
import { useSystem } from '~/contexts/SystemContext'
// apis
import { getSystems, getSystemNodes } from '~/apis/status-api'
// types
import type { SystemNodesOverview } from '~/types/api-status'
// views
import ErrorView from '~/components/views/ErrorView'
import DashboardView from '~/modules/dashboard/components/views/DashboardView'
// spinners
import LoadingSpinner from '~/components/spinners/LoadingSpinner'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Check authentication
  const { auth } = await requireAuth(request)
  logInfoHttp({
    eventAction: LogPage.INDEX,
    request: request,
    extraInfo: { username: auth.user.username },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Chain getSystems (shared deduped promise) into per-system node promises without
  // awaiting — loader returns immediately so the shell renders before the HTTP call.
  const nodeState = (n: { state: string | string[] }) =>
    (Array.isArray(n.state) ? n.state[0] : n.state).toLowerCase()
  const systemsNodesPromise = getSystems(accessToken, request).then(({ systems }) =>
    Object.fromEntries(
      systems.map((system) => [
        system.name,
        promiseWithTimeout(
          getSystemNodes(accessToken, system.name, request),
          DEFERRED_PROMISE_TIMEOUT_MS,
          `Loading nodes for ${system.name} timed out.`,
        )
          .then(({ nodes }) => ({
            available: nodes.filter((n) => nodeState(n) === 'idle').length,
            allocated: nodes.filter((n) => ['alloc', 'allocated'].includes(nodeState(n))).length,
            unavailable:
              nodes.length -
              nodes.filter((n) => nodeState(n) === 'idle').length -
              nodes.filter((n) => ['alloc', 'allocated'].includes(nodeState(n))).length,
            total: nodes.length,
          } as SystemNodesOverview))
          .catch((error) => {
            const msg = error instanceof Response ? `${error.status} ${error.statusText}` : error
            console.warn(`Failed to load nodes for system ${system.name}:`, msg)
            return null
          }),
      ]),
    ) as Record<string, Promise<SystemNodesOverview | null>>,
  )
  return data({ systemsNodesPromise })
}

export default function AppIndexRoute() {
  const { systems } = useSystem()
  // Cast needed: Remix's JsonifyObject strips Promise wrappers from deferred loader data
  const { systemsNodesPromise } = useLoaderData<typeof loader>() as unknown as {
    systemsNodesPromise: Promise<Record<string, Promise<SystemNodesOverview | null>>>
  }
  return (
    <Suspense fallback={<LoadingSpinner className='h-full' />}>
      <Await resolve={systemsNodesPromise}>
        {(systemsNodesPromises) => (
          <DashboardView systems={systems} systemsNodesPromises={systemsNodesPromises} />
        )}
      </Await>
    </Suspense>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return <ErrorView error={error} />
}
