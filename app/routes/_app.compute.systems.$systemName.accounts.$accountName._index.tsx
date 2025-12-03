/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useLoaderData, useRouteError } from '@remix-run/react'
import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// types
import type { GetSystemJobsResponse } from '~/types/api-job'
import type { System } from '~/types/api-status'
// loggers
import logger from '~/logger/logger'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
// utils
import { getAuthAccessToken, authenticator } from '~/utils/auth.server'
// apis
import { getJobs } from '~/apis/compute-api'
import { getSystems } from '~/apis/status-api'
// views
import ErrorView from '~/components/views/ErrorView'
import JobListView from '~/modules/compute/components/views/JobListView'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Check authentication
  const auth = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  })
  const systemName = params.systemName!
  const accountName = params.accountName!
  logInfoHttp({
    message: `Compute system ${systemName} account ${accountName} index page`,
    request: request,
    extraInfo: { username: auth.user.username },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Call api/s and fetch data
  const { systems } = await getSystems(accessToken)
  const response: GetSystemJobsResponse = await getJobs(accessToken, systemName, accountName)
  // Return response
  return { systems, systemsJobs: [response] }
}

export default function AppComputeIandexRoute() {
  const { systems, systemsJobs }: any = useLoaderData()
  return <JobListView systems={systems} systemsJobs={systemsJobs} />
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
