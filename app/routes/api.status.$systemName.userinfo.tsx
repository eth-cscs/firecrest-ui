/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
// helpers
import { promiseWithTimeout, DEFERRED_PROMISE_TIMEOUT_MS } from '~/helpers/promise-helper'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { getUserInfo } from '~/apis/status-api'
import { isMaintenanceResponse, getMaintenanceMessage, MAINTENANCE_REASON } from '~/apis/api'
// types
import type { GetUserInfoResponse } from '~/types/api-status'

// Consumed via useFetcher (see the compute/filesystem system layouts) - a thrown/non-2xx
// Response wouldn't cleanly populate fetcher.data, so any failure (including maintenance) is
// flattened into a normal 200 response, same convention as api.status.$systemName.nodes.tsx.
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const headers = new Headers()
  const accessToken = await getAuthAccessToken(request, headers)
  const systemName = params.systemName!
  try {
    const userInfo = await promiseWithTimeout(
      getUserInfo(accessToken, systemName, request),
      DEFERRED_PROMISE_TIMEOUT_MS,
      `Loading user info for ${systemName} timed out.`,
    )
    return data<GetUserInfoResponse>(userInfo, { headers })
  } catch (error) {
    if (isMaintenanceResponse(error)) {
      return data(
        { maintenance: true, reason: MAINTENANCE_REASON, message: await getMaintenanceMessage(error) },
        { headers },
      )
    }
    return data<null>(null, { headers })
  }
}
