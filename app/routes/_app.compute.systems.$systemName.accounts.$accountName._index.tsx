/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useLoaderData, useRouteError } from '@remix-run/react'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { defer } from '@remix-run/node'
// loggers
import logger from '~/logger/logger'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { promiseWithTimeout } from '~/helpers/promise-helper'
// utils
import { getAuthAccessToken, requireAuth, authenticator } from '~/utils/auth.server'
// apis
import { getJobs } from '~/apis/compute-api'
// views
import ErrorView from '~/components/views/ErrorView'
import JobListView from '~/modules/compute/components/views/JobListView'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // Check authentication
  const { auth } = await requireAuth(request, authenticator)
  // Get params
  const systemName = params.systemName!
  const accountName = params.accountName!
  // Get request info
  const [, searchParams] = request.url.split('?')
  // Check if allUsers is set
  const allUsers = new URLSearchParams(searchParams).get('allUsers') === 'true' ? true : false
  logInfoHttp({
    message: `Compute system ${systemName} account ${accountName} index page`,
    request: request,
    extraInfo: { username: auth.user.username },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Call api/s and fetch data - deferred for better UX with timeout protection
  const jobsPromise = promiseWithTimeout(
    getJobs(accessToken, systemName, accountName, allUsers),
    30000, // 30 seconds timeout
    'Loading jobs took too long. The system might be busy or unavailable.',
  )
  // Return deferred response
  return defer({ jobsPromise })
}

export default function AppComputeIandexRoute() {
  const { jobsPromise } = useLoaderData<typeof loader>()
  return <JobListView jobsPromise={jobsPromise} />
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
