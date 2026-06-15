/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { data } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { getSystemNodes } from '~/apis/status-api.server'
// helpers
import { promiseWithTimeout, DEFERRED_PROMISE_TIMEOUT_MS } from '~/helpers/promise-helper'
// types
import type { SystemNodesOverview } from '~/types/api-status'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const headers = new Headers()
  // Auth errors (unauthenticated/expired session) propagate as 401 — not caught below.
  const accessToken = await getAuthAccessToken(request, headers)
  const systemName = params.systemName!
  const nodeState = (n: { state: string | string[] }) =>
    (Array.isArray(n.state) ? n.state[0] : n.state).toLowerCase()
  try {
    const { nodes } = await promiseWithTimeout(
      getSystemNodes(accessToken, systemName, request),
      DEFERRED_PROMISE_TIMEOUT_MS,
      `Loading nodes for ${systemName} timed out.`,
    )
    return data<SystemNodesOverview>(
      {
        available: nodes.filter((n) => nodeState(n) === 'idle').length,
        allocated: nodes.filter((n) => ['alloc', 'allocated'].includes(nodeState(n))).length,
        unavailable:
          nodes.length -
          nodes.filter((n) => nodeState(n) === 'idle').length -
          nodes.filter((n) => ['alloc', 'allocated'].includes(nodeState(n))).length,
        total: nodes.length,
      },
      { headers },
    )
  } catch {
    return data<null>(null, { headers })
  }
}
