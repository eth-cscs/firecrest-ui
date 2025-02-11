/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// types
import { GetJobResponse } from '~/types/api-job'
// helpers
import { handleApiErrorResponse, handleSuccessResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { getJob } from '~/apis/compute-api'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
  try {
    // Get query params
    const jobId: any = params.jobId
    const systemName: string = params.systemName || ''
    // Get data
    const response: GetJobResponse = await getJob(accessToken, systemName, jobId)
    // Return response
    return handleSuccessResponse(response)
  } catch (error) {
    return handleApiErrorResponse(error)
  }
}
