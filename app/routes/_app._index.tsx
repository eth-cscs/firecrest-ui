/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useLoaderData, useRouteError } from '@remix-run/react'
import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// loggers
import logger from '~/logger/logger'
// types
import type { GetSystemJobsResponse, Job } from '~/types/api-job'
import { JobStateStatus } from '~/types/api-job'
import type { System } from '~/types/api-status'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
// utils
import { authenticator, getAuthAccessToken } from '~/utils/auth.server'
// contexts
import { useSystem } from '~/contexts/SystemContext'
// apis
import { getSystems } from '~/apis/status-api'
import { getJobs } from '~/apis/compute-api'
// views
import ErrorView from '~/components/views/ErrorView'
import DashboardView from '~/modules/dashboard/components/views/DashboardView'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Check authentication
  const auth = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  })
  logInfoHttp({
    message: 'Index page',
    request: request,
    extraInfo: { username: auth.user.username },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Call api/s and fetch data
  const { systems } = await getSystems(accessToken)
  
  // Return response (deferred response)
  return {
    systems: systems,
  }
}

export default function AppIndexRoute() {
  const { systems } = useSystem()
  return <DashboardView systems={systems} />
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
