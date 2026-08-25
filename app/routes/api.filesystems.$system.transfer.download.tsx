/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { StatusCodes } from 'http-status-codes'
import type { ActionFunctionArgs } from 'react-router'
// types
import { PostTransferDownloadRequest } from '~/types/api-filesystem'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { LogAction } from '~/helpers/log-labels'
import { handleApiErrorResponse, handleSuccessResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken, getAuthUser } from '~/utils/auth.server'
// apis
import { postTransferDownload } from '~/apis/filesystem-api'
// validations
import { validateTransferDownload } from '~/validations/filesystemTransferValidation'

export const action = async ({ params, request }: ActionFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
  const authUser = await getAuthUser(request)
  // Get form data
  const formData: FormData = await request.formData()
  try {
    // Get path params
    const system: string = params.system || ''
    // Validate
    const payloadData: PostTransferDownloadRequest = await validateTransferDownload(formData)
    // Put data
    const requestId = crypto.randomUUID()
    const response = await postTransferDownload(
      accessToken,
      system,
      payloadData.path,
      payloadData.account,
      request,
      requestId,
    )
    logInfoHttp({
      eventAction: LogAction.FS_TRANSFER_DOWNLOAD,
      request,
      requestId,
      extraInfo: { username: authUser?.username, system },
    })
    // Return response
    return handleSuccessResponse(response, StatusCodes.OK, headers)
  } catch (error) {
    return handleApiErrorResponse(error)
  }
}
