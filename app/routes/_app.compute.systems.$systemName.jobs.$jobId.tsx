/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from '@remix-run/node'
import { StatusCodes } from 'http-status-codes'
import { useRouteError, useLoaderData, redirect, useActionData } from '@remix-run/react'
// types
import { GetJobMetadataResponse, GetJobResponse } from '~/types/api-job'
import { GetSystemsResponse, System } from '~/types/api-status'
// loggers
import logger from '~/logger/logger'
// errors
import { HttpError } from '~/errors/HttpError'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { getErrorFromData } from '~/helpers/error-helper'
import { handleErrorResponse } from '~/helpers/response-helper'
import { notifySuccessMessage } from '~/helpers/notification-helper'
// utils
import { getAuthAccessToken, authenticator } from '~/utils/auth.server'
// apis
import { getJob, cancelJob, getJobMetadata } from '~/apis/compute-api'
import { getSystems } from '~/apis/status-api'
// views
import ErrorView from '~/components/views/ErrorView'
import JobDetailsView from '~/modules/compute/components/views/JobDetailsView'
import JobDetailsConsoleView from '~/modules/compute/components/views/JobDetailsConsoleView'
// observability
import observability from '~/configs/observability.config'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Check authentication
  const auth = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  })
  logInfoHttp({
    message: 'Compute job detail page',
    request: request,
    extraInfo: { username: auth.user.username },
  })
  // Layout
  let layoutMode = 'standard'
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  const jobId: any = params.jobId
  const systemName: string = params.systemName || ''
  // Call api/s and fetch data
  const [systemsResponse, jobResponse, jobMetadataResponse]: [
    GetSystemsResponse,
    GetJobResponse,
    GetJobMetadataResponse,
  ] = await Promise.all([
    getSystems(accessToken),
    getJob(accessToken, systemName, jobId),
    getJobMetadata(accessToken, systemName, jobId),
  ])
  // Filtering data
  const { jobs } = jobMetadataResponse
  const { systems } = systemsResponse
  const system: System | undefined = systems.find((system: System) => {
    return system.name === systemName
  })
  // const layoutMode = fromQuery ?? cookieLayout ?? fromBackend ?? null;
  if (jobs && jobs.length !== 0) {
    const job = jobs[0]
    if (job.script && job.script !== 'NONE') {
      layoutMode = 'fixed-right'
    }
  }
  // Return response
  return {
    jobs: jobResponse.jobs,
    jobsMetadata: jobMetadataResponse.jobs,
    system: system,
    dashboard: observability.dashboard || null,
    // layoutMode: layoutMode,
  }
}

export const action: ActionFunction = async ({ params, request }: ActionFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
  // Get form data
  const form = await request.formData()
  try {
    // Check the intent
    if (form.get('intent') !== 'delete') {
      throw new HttpError(
        StatusCodes.BAD_REQUEST,
        `The intent ${form.get('intent')} is not supported`,
      )
    }
    // Get params
    const jobId: any = params.jobId
    const systemName: string = params.systemName || ''
    // Cancel the job
    await cancelJob(accessToken, systemName, jobId, request)
    // Notify success message
    await notifySuccessMessage(
      {
        title: 'Job cancel',
        text: `Job with ID "${params.jobId}" has been canceled successfully`,
      },
      request,
      headers,
    )
    // Redirect with headers
    return redirect(`/compute`, {
      headers: headers,
    })
  } catch (error) {
    return handleErrorResponse(error)
  }
}

export const handle = { layoutMode: 'fixed-right' as const }

export default function ComputeJobDetailsRoute() {
  const data = useActionData()
  const { jobs, jobsMetadata, system, dashboard, layoutMode }: any = useLoaderData()
  // if (layoutMode === 'fixed-right') {
  return (
    <JobDetailsConsoleView
      jobs={jobs}
      jobsMetadata={jobsMetadata}
      system={system}
      error={getErrorFromData(data)}
      dashboard={dashboard}
    />
  )
  // }
  // return (
  //   <JobDetailsView
  //     jobs={jobs}
  //     jobsMetadata={jobsMetadata}
  //     system={system}
  //     error={getErrorFromData(data)}
  //     dashboard={dashboard}
  //   />
  // )
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
