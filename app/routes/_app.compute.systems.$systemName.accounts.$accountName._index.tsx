/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useLoaderData, useRouteError } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
// loggers
import logger from '~/logger/logger.server'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { logPageLabel } from '~/helpers/log-labels'
import { promiseWithTimeout, DEFERRED_PROMISE_TIMEOUT_MS } from '~/helpers/promise-helper'
// utils
import { getAuthAccessToken, requireAuth } from '~/utils/auth.server'
// apis
import { getJobs } from '~/apis/compute-api'
import { isMaintenanceResponse, getMaintenanceMessage, MAINTENANCE_REASON } from '~/apis/api'
// views
import ErrorView from '~/components/views/ErrorView'
import JobListView from '~/modules/compute/components/views/JobListView'
// types
import type { GetSystemJobsResponse } from '~/types/api-job'
import type { MaintenancePayload } from '~/apis/api'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // Check authentication
  const { auth } = await requireAuth(request)
  // Get params
  const systemName = params.systemName!
  const accountName = params.accountName!
  // Get request info
  const [, searchParams] = request.url.split('?')
  // Check if allUsers is set
  const allUsers = new URLSearchParams(searchParams).get('allUsers') === 'true' ? true : false
  logInfoHttp({
    eventAction: logPageLabel.computeAccountIndex(systemName, accountName),
    request: request,
    extraInfo: { username: auth.user.username, system: systemName, account: accountName },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Call api/s and fetch data - deferred for better UX with timeout protection.
  // Resolves with an error object on timeout so the job list view renders inline rather than
  // triggering the route ErrorBoundary. Maintenance resolves too, with a flagged payload (see
  // api.ts's isMaintenancePayload) - a rejected Error gets its message wiped by
  // @remix-run/server-runtime's production sanitization before it crosses the turbo-stream
  // boundary, so rejecting can't carry the signal.
  const jobsPromise = promiseWithTimeout(
    getJobs(accessToken, systemName, accountName, allUsers, request),
    DEFERRED_PROMISE_TIMEOUT_MS,
  ).catch(async (error): Promise<GetSystemJobsResponse | MaintenancePayload> => {
    if (isMaintenanceResponse(error)) {
      return {
        maintenance: true,
        reason: MAINTENANCE_REASON,
        message: await getMaintenanceMessage(error),
      }
    }
    return {
      system: systemName,
      jobs: [],
      account: accountName,
      allUsers,
      error: { message: 'Loading jobs took too long. The system might be busy or unavailable.' },
    }
  })
  // Return deferred response
  return { jobsPromise }
}

export default function AppComputeIandexRoute() {
  const { jobsPromise } = useLoaderData<typeof loader>()
  return <JobListView jobsPromise={jobsPromise} />
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return <ErrorView error={error} />
}
