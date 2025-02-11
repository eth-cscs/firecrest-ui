/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { StatusCodes } from 'http-status-codes'
import type { ActionFunction, ActionFunctionArgs } from '@remix-run/node'
// types
import { PostOpsSymlinkRequest } from '~/types/api-filesystem'
// helpers
import { notifySuccessMessage } from '~/helpers/notification-helper'
import { handleApiErrorResponse, handleSuccessResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { postOpsSymlink } from '~/apis/filesystem-api'
// validations
import { validateOpsSymlink } from '~/validations/filesystemOpsValidation'

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
    const payloadData: PostOpsSymlinkRequest = await validateOpsSymlink(formData)
    // Put data
    const response = await postOpsSymlink(
      accessToken,
      system,
      payloadData.targetPath,
      payloadData.linkPath,
    )
    // Notify success message
    await notifySuccessMessage(
      {
        title: 'Symlink created',
        text: `Symlink "${payloadData.linkPath}" have been created successfully`,
      },
      request,
      headers,
    )
    // Return response
    return handleSuccessResponse(response, StatusCodes.CREATED, headers)
  } catch (error) {
    return handleApiErrorResponse(error)
  }
}
