/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { StatusCodes } from 'http-status-codes'
import type { LoaderFunctionArgs, LoaderFunction } from '@remix-run/node'
// helpers
import { handleErrorResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { getOpsDownload } from '~/apis/filesystem-api'

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
    const sourcePath = url.searchParams.get('sourcePath') || ''
    const fileName = sourcePath.substring(sourcePath.lastIndexOf('/') + 1)
    // Download file
    const fileDownloaded = await getOpsDownload(accessToken, system, sourcePath)
    // Return response
    return new Response(fileDownloaded, {
      status: StatusCodes.OK,
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    return handleErrorResponse(error)
  }
}
