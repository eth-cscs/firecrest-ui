import { useLoaderData, useRouteError } from '@remix-run/react'
import { captureRemixErrorBoundaryError } from '@sentry/remix'
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
  const runningJobs: GetSystemJobsResponse[] = []
  await Promise.all(
    systems.map((system: System) => {
      return getJobs(accessToken, system)
    }),
  ).then((systemJobs) => {
    systemJobs.map((jobResponse: GetSystemJobsResponse) => {
      if (jobResponse.jobs == null) {
        runningJobs.push(jobResponse)
      } else {
        const systemJobs: GetSystemJobsResponse = {
          ...jobResponse,
          jobs: jobResponse.jobs.filter((job: Job) => {
            return job.status.state === JobStateStatus.RUNNING
          }),
        }
        runningJobs.push(systemJobs)
      }
    })
  })
  // Return response (deferred response)
  return {
    systems: systems,
    runningJobs,
  }
}

export default function AppIndexRoute() {
  const { systems, runningJobs }: any = useLoaderData()
  return <DashboardView systems={systems} runningJobs={runningJobs} />
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  captureRemixErrorBoundaryError(error)
  return <ErrorView error={error} />
}
