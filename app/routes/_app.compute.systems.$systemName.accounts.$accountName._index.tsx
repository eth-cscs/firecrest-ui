/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import * as React from 'react'
import { Await, useAsyncError, useLoaderData, useRouteError } from '@remix-run/react'
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
import LoadingSpinner from '~/components/spinners/LoadingSpinner'
import AsyncError from '~/components/errors/AsyncError'
import JobListView from '~/modules/compute/components/views/JobListView'

// types
import type { GetSystemJobsResponse } from '~/types/api-job'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { auth } = await requireAuth(request, authenticator)

  const systemName = params.systemName!
  const accountName = params.accountName!

  const url = new URL(request.url)
  const allUsers = url.searchParams.get('allUsers') === 'true'

  logInfoHttp({
    message: `Compute system ${systemName} account ${accountName} index page`,
    request,
    extraInfo: { username: auth.user.username },
  })

  const accessToken = await getAuthAccessToken(request)

  const jobs = promiseWithTimeout(
    getJobs(accessToken, systemName, accountName, allUsers),
    30000,
    'Loading jobs took too long. The system might be busy or unavailable.',
  )

  return defer({ jobs })
}

function JobsAwaitError() {
  const err = useAsyncError()
  // Reuse your existing async error component (or ErrorView)
  return <AsyncError error={err} />
}

export default function AppComputeIndexRoute() {
  const { jobs } = useLoaderData<typeof loader>()

  return (
    <React.Suspense fallback={<LoadingSpinner title='Loading jobs...' className='py-10' />}>
      <Await resolve={jobs} errorElement={<JobsAwaitError />}>
        {(resolved: GetSystemJobsResponse) => <JobListView jobs={resolved} />}
      </Await>
    </React.Suspense>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
