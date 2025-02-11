/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { StatusCodes } from 'http-status-codes'
import type { ActionFunction, ActionFunctionArgs } from '@remix-run/node'
// types
import { PutOpsChownRequest } from '~/types/api-filesystem'
// helpers
import { notifySuccessMessage } from '~/helpers/notification-helper'
import { handleApiErrorResponse, handleSuccessResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { putOpsChown } from '~/apis/filesystem-api'
// validations
import { validateOpsChown } from '~/validations/filesystemOpsValidation'

export const action: ActionFunction = async ({ params, request }: ActionFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
  // Get form data
  const formData: FormData = await request.formData()
  try {
    // Get path params
    const system: string = params.system || ''
    // Validate
    const payloadData: PutOpsChownRequest = await validateOpsChown(formData)
    // Put data
    const response = await putOpsChown(
      accessToken,
      system,
      payloadData.targetPath,
      payloadData.owner || '',
      payloadData.group || '',
    )
    // Notify success message
    await notifySuccessMessage(
      {
        title: 'Change ownership',
        text: `The ownership of "${payloadData.targetPath}" has been changed successfully`,
      },
      request,
      headers,
    )
    // Return response
    return handleSuccessResponse(response, StatusCodes.OK, headers)
  } catch (error) {
    return handleApiErrorResponse(error)
  }
}
