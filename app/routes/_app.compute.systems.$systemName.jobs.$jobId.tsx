/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { LoaderFunctionArgs } from 'react-router'
import { redirect, useRouteError } from 'react-router'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { LogPage } from '~/helpers/log-labels'
// utils
import { getAuthAccessToken, requireAuth } from '~/utils/auth.server'
// apis
import { getJob } from '~/apis/compute-api'
// views
import ErrorView from '~/components/views/ErrorView'

// Job links that only know the system and job id (e.g. from the RL run history): the job view
// lives under the job's account, so this looks the account up and redirects there
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // Check authentication
  const { auth } = await requireAuth(request)
  const systemName = params.systemName || ''
  const jobId = params.jobId || ''
  logInfoHttp({
    eventAction: LogPage.COMPUTE_JOB_LINK,
    request: request,
    extraInfo: { username: auth.user.username, system: systemName },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  const { jobs } = /^\d+$/.test(jobId)
    ? await getJob(accessToken, systemName, jobId, request)
    : { jobs: [] }
  const account = jobs?.[0]?.account
  if (!account) {
    // FirecREST only returns jobs of accounts the user is a member of
    throw new Response(
      `Job ${jobId} was not found on ${systemName}, or it belongs to an account you are not a member of.`,
      {
        status: StatusCodes.NOT_FOUND,
        statusText: ReasonPhrases.NOT_FOUND,
      },
    )
  }
  return redirect(
    `/compute/systems/${encodeURIComponent(systemName)}/accounts/${encodeURIComponent(account)}/jobs/${jobId}`,
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return <ErrorView error={error} />
}
