/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { ActionFunctionArgs } from 'react-router'
import { parseMultipartRequest, MaxFileSizeExceededError } from '@mjackson/multipart-parser'
// types
import { PostFileUploadPayload } from '~/types/api-filesystem'
// helpers
import { StatusCodes } from 'http-status-codes'
import { logInfoHttp } from '~/helpers/log-helper'
import { LogAction } from '~/helpers/log-labels'
import { notifySuccessMessage } from '~/helpers/notification-helper'
import {
  handleApiErrorResponse,
  handleSuccessResponse,
  MaxPartSizeExceededError,
} from '~/helpers/response-helper'
// utils
import { getAuthAccessToken, getAuthUser } from '~/utils/auth.server'
// apis
import { postFileUpload } from '~/apis/filesystem-api'
import { getSystems } from '~/apis/status-api'
// validation
import { validateFileUpload } from '~/validations/filesystemValidation'

export const action = async ({ params, request }: ActionFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
  const authUser = await getAuthUser(request)
  const system: string = params.system || ''
  const { systems } = await getSystems(accessToken, request)
  const maxOpsFileSize = systems.find((s) => s.name === system)?.dataOperation?.max_ops_file_size
  if (!maxOpsFileSize) {
    throw new Error(`System "${system}" not found or has no file size limit configured`)
  }
  try {
    // Build FormData manually rather than using @mjackson/form-data-parser's
    // parseFormData: its part.isFile detection skips parts with no filename in
    // Content-Disposition (common with some nginx configurations), same as the
    // handler this replaces used to work around. Forcing the 'file' field to
    // always become a File, filename or not, needs the lower-level part iterator.
    const formData = new FormData()
    for await (const part of parseMultipartRequest(request, { maxFileSize: maxOpsFileSize })) {
      if (!part.name) continue
      if (part.name === 'file' || part.isFile) {
        formData.append(
          part.name,
          new File([part.bytes as BlobPart], part.filename || 'upload', {
            type: part.mediaType || 'application/octet-stream',
          }),
        )
      } else {
        formData.append(part.name, part.text)
      }
    }
    const fileValue = formData.get('file')
    const originalFileName = (formData.get('fileName') as string) || (fileValue as any)?.name
    const payloadData: PostFileUploadPayload = await validateFileUpload(formData, maxOpsFileSize)
    const requestId = crypto.randomUUID()
    await postFileUpload(
      accessToken,
      system,
      payloadData.path,
      payloadData.file,
      originalFileName,
      request,
      requestId,
    )
    logInfoHttp({
      eventAction: LogAction.FS_UPLOAD,
      request,
      requestId,
      extraInfo: { username: authUser?.username, system },
    })
    await notifySuccessMessage(
      {
        title: 'File upload',
        text: `File "${originalFileName}" was uploaded successfully at the target path "${payloadData.path}"`,
      },
      request,
      headers,
    )
    return handleSuccessResponse(
      {
        result: {
          system,
          targetPath: payloadData.path,
        },
      },
      StatusCodes.CREATED,
    )
  } catch (error) {
    if (error instanceof MaxFileSizeExceededError) {
      return handleApiErrorResponse(new MaxPartSizeExceededError(maxOpsFileSize))
    }
    return handleApiErrorResponse(error)
  }
}
