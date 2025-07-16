/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { captureRemixErrorBoundaryError } from '@sentry/remix'
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

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Check authentication
  const auth = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  })
  logInfoHttp({
    message: 'Compute index page',
    request: request,
    extraInfo: { username: auth.user.username },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Call api/s and fetch data
  const { systems } = await getSystems(accessToken)
  const systemsJobs: GetSystemJobsResponse[] = []
  await Promise.all(
    systems.map((system: System) => {
      return getJobs(accessToken, system)
    }),
  ).then((systemJobs) => {
    systemJobs.map((jobResponse: GetSystemJobsResponse) => {
      systemsJobs.push(jobResponse)
    })
  })
  // Return response
  return { systems, systemsJobs }
}

export default function AppComputeIndexRoute() {
  const { systems, systemsJobs }: any = useLoaderData()
  return <JobListView systems={systems} systemsJobs={systemsJobs} />
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  captureRemixErrorBoundaryError(error)
  return <ErrorView error={error} />
}
