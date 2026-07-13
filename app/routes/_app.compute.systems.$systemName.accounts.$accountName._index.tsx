/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useLoaderData, useRouteError } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { logPageLabel } from '~/helpers/log-labels'
// utils
import { requireAuth } from '~/utils/auth.server'
import { jobsAllUsersCookie } from '~/utils/preferences.server'
// views
import ErrorView from '~/components/views/ErrorView'
import JobListView from '~/modules/compute/components/views/JobListView'

// Jobs are fetched client-side by JobList itself (useFetcher, polling every 2s) rather than
// through this loader - a deferred/streamed loader response here doesn't survive a buffering
// reverse proxy (e.g. Traefik with response buffering enabled) well: the browser can be left
// staring at the Suspense fallback indefinitely since the streamed chunk never arrives, even
// though the server resolved it fine. See JobList.tsx and api.compute.systems.$systemName
// .accounts.$accountName.jobs.tsx.
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // Check authentication
  const { auth } = await requireAuth(request)
  // Get params
  const systemName = params.systemName!
  const accountName = params.accountName!
  // The URL wins when it says something explicitly; otherwise fall back to the remembered
  // choice, so the toggle survives fresh navigations (e.g. a sidebar link), not just back/forward.
  const searchParams = new URL(request.url).searchParams
  const allUsers = searchParams.has('allUsers')
    ? searchParams.get('allUsers') === 'true'
    : (await jobsAllUsersCookie.parse(request.headers.get('Cookie'))) === true
  logInfoHttp({
    eventAction: logPageLabel.computeAccountIndex(systemName, accountName),
    request: request,
    extraInfo: { username: auth.user.username, system: systemName, account: accountName },
  })
  return { allUsers }
}

export default function AppComputeIandexRoute() {
  const { allUsers } = useLoaderData<typeof loader>()
  return <JobListView initialAllUsers={allUsers} />
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return <ErrorView error={error} />
}
