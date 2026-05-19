/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { ActionFunction, ActionFunctionArgs } from '@remix-run/node'
import {
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  MaxPartSizeExceededError,
} from '@remix-run/node'
// types
import { PostFileUploadPayload } from '~/types/api-filesystem'
// helpers
import { StatusCodes } from 'http-status-codes'
import { logInfoHttp } from '~/helpers/log-helper'
import { notifySuccessMessage } from '~/helpers/notification-helper'
import { handleApiErrorResponse, handleSuccessResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { postFileUpload } from '~/apis/filesystem-api'
import { getSystems } from '~/apis/status-api'
// validation
import { validateFileUpload } from '~/validations/filesystemValidation'

export const action: ActionFunction = async ({ params, request }: ActionFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
  const system: string = params.system || ''
  const { systems } = await getSystems(accessToken)
  const maxOpsFileSize = systems.find((s) => s.name === system)?.dataOperation?.max_ops_file_size
  if (!maxOpsFileSize) {
    throw new Error(`System "${system}" not found or has no file size limit configured`)
  }
  const memHandler = unstable_createMemoryUploadHandler()
  // Custom handler: the standard file handler silently skips parts with no
  // filename in Content-Disposition (common with some nginx configurations).
  // For the 'file' part we collect chunks directly and return a File object
  // regardless of whether filename is present, using the fileName text field
  // sent by the client as the authoritative name.
  const uploadHandler = async (part: any) => {
    if (part.name === 'file') {
      const chunks: BlobPart[] = []
      let size = 0
      for await (const chunk of part.data) {
        size += chunk.byteLength
        if (size > maxOpsFileSize) {
          throw new MaxPartSizeExceededError('file', maxOpsFileSize)
        }
        chunks.push(chunk)
      }
      return new File(chunks, part.filename || 'upload', {
        type: part.contentType || 'application/octet-stream',
      })
    }
    return memHandler(part)
  }
  try {
    const formData = await unstable_parseMultipartFormData(request, uploadHandler)
    const fileValue = formData.get('file')
    const originalFileName = (formData.get('fileName') as string) || (fileValue as any)?.name
    console.log('[upload] file type:', typeof fileValue, (fileValue as any)?.constructor?.name, 'size:', (fileValue as any)?.size, 'name:', (fileValue as any)?.name, 'originalFileName:', originalFileName)
    console.log('[upload] maxOpsFileSize:', maxOpsFileSize)
    const payloadData: PostFileUploadPayload = await validateFileUpload(formData, maxOpsFileSize)
    await postFileUpload(
      accessToken,
      system,
      payloadData.path,
      payloadData.file,
      originalFileName,
      request,
    )
    logInfoHttp({ message: 'fs.upload', request, extraInfo: { system, operation: 'upload' } })
    await notifySuccessMessage(
      {
        title: 'File upload',
        text: `File "${originalFileName}" have been upload successfully at the target path "${payloadData.path}"`,
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
    return handleApiErrorResponse(error)
  }
}
