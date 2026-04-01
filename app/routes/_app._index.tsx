/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useLoaderData, useRouteError } from '@remix-run/react'
// eslint-disable-next-line @typescript-eslint/no-deprecated
import { defer } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'
// loggers
import logger from '~/logger/logger'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { promiseWithTimeout } from '~/helpers/promise-helper'
// utils
import { authenticator, requireAuth, getAuthAccessToken } from '~/utils/auth.server'
// contexts
import { useSystem } from '~/contexts/SystemContext'
// apis
import { getSystems, getSystemNodes } from '~/apis/status-api'
// types
import type { SystemNodesOverview } from '~/types/api-status'
// views
import ErrorView from '~/components/views/ErrorView'
import DashboardView from '~/modules/dashboard/components/views/DashboardView'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Check authentication
  const { auth } = await requireAuth(request, authenticator)
  logInfoHttp({
    message: 'Index page',
    request: request,
    extraInfo: { username: auth.user.username },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Call api/s and fetch data
  const { systems } = await getSystems(accessToken)
  // Defer nodes fetching — resolves to a map of system name → nodes health
  const systemsNodesPromise = Promise.all(
    systems.map(async (system) => {
      try {
        const { nodes } = await promiseWithTimeout(
          getSystemNodes(accessToken, system.name),
          15000,
          `Loading nodes for ${system.name} timed out.`,
        )
        const nodeState = (n: { state: string | string[] }) =>
          (Array.isArray(n.state) ? n.state[0] : n.state).toLowerCase()
        return {
          name: system.name,
          nodes: {
            available: nodes.filter((n) => nodeState(n) === 'idle').length,
            allocated: nodes.filter((n) => ['alloc', 'allocated'].includes(nodeState(n))).length,
            total: nodes.length,
          } as SystemNodesOverview,
        }
      } catch (error) {
        const msg = error instanceof Response ? `${error.status} ${error.statusText}` : error
        console.warn(`Failed to load nodes for system ${system.name}:`, msg)
        return { name: system.name, nodes: null }
      }
    }),
  ).then((results) => {
    const systemsNodes: Record<string, SystemNodesOverview | null> = {}
    for (const result of results) {
      systemsNodes[result.name] = result.nodes
    }
    return systemsNodes
  })
  // Return response with deferred promise (defer is needed for Remix v2 streaming)
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return defer({
    systems,
    systemsNodesPromise,
  })
}

export default function AppIndexRoute() {
  const { systems } = useSystem()
  const { systemsNodesPromise } = useLoaderData<typeof loader>()
  return <DashboardView systems={systems} systemsNodesPromise={systemsNodesPromise} />
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
