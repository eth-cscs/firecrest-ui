/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
import { data } from '@remix-run/node'
// types
import { GetSystemJobsResponse } from '~/types/api-job'
// helpers
import { promiseWithTimeout, DEFERRED_PROMISE_TIMEOUT_MS } from '~/helpers/promise-helper'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { getJobs } from '~/apis/compute-api'
import { isMaintenanceResponse, getMaintenanceMessage, MAINTENANCE_REASON } from '~/apis/api'

// Consumed via useFetcher (see JobList.tsx), which needs a normal 200 response either way - a
// thrown/non-2xx Response wouldn't cleanly populate fetcher.data (see api.ts's isMaintenancePayload
// comment). getJobs() itself never throws except for a maintenance-classified Response (it swallows
// every other error into a normal { ...error } return), so the only thing this catch has to turn
// into a flagged payload is that one case - plus a timeout, guarding against a backend that just
// never responds.
export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
  const systemName = params.systemName!
  const accountName = params.accountName!
  const [, searchParams] = request.url.split('?')
  const allUsers = new URLSearchParams(searchParams).get('allUsers') === 'true' ? true : false
  try {
    const response = await promiseWithTimeout(
      getJobs(accessToken, systemName, accountName, allUsers, request),
      DEFERRED_PROMISE_TIMEOUT_MS,
      `Loading jobs for ${systemName} timed out.`,
    )
    return data<GetSystemJobsResponse>(response, { headers })
  } catch (error) {
    if (isMaintenanceResponse(error)) {
      return data(
        { maintenance: true, reason: MAINTENANCE_REASON, message: await getMaintenanceMessage(error) },
        { headers },
      )
    }
    return data<GetSystemJobsResponse>(
      {
        system: systemName,
        jobs: [],
        account: accountName,
        allUsers,
        error: { message: 'Loading jobs took too long. The system might be busy or unavailable.' },
      },
      { headers },
    )
  }
}
