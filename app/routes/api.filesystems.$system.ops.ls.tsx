/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// types
import { GetOpsLsResponse } from '~/types/api-filesystem'
// helpers
import { handleApiErrorResponse, handleSuccessResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { getOpsLs } from '~/apis/filesystem-api'

export const loader: LoaderFunction = async ({ params, request }: LoaderFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
  try {
    // Get path params
    const system: string = params.system || ''
    // Get query params
    const url = new URL(request.url)
    const targetPath = url.searchParams.get('targetPath') || ''
    // Get data
    const response: GetOpsLsResponse = await getOpsLs(accessToken, system, targetPath)
    // Return response
    return handleSuccessResponse(response)
  } catch (error) {
    return handleApiErrorResponse(error)
  }
}
