/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
// types
import { GetSystemJobsResponse } from '~/types/api-job'
// helpers
import { handleApiErrorResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { getJobs } from '~/apis/compute-api'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
  try {
    // Get query params
    // Get params
    const systemName = params.systemName!
    const accountName = params.accountName!
    // Get request info
    const [, searchParams] = request.url.split('?')
    // Check if allUsers is set
    const allUsers = new URLSearchParams(searchParams).get('allUsers') === 'true' ? true : false
    // Get data
    const response: GetSystemJobsResponse = await getJobs(
      accessToken,
      systemName,
      accountName,
      allUsers,
    )
    return json(response, { headers })
  } catch (error) {
    return handleApiErrorResponse(error)
  }
}
