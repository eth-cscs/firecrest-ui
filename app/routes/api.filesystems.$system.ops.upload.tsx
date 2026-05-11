/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import os from 'os';
import {v4 as uuidv4} from 'uuid';

import type { ActionFunction, ActionFunctionArgs } from '@remix-run/node'
import {
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  unstable_createFileUploadHandler,
} from '@remix-run/node'
// types
import { PostFileUploadPayload } from '~/types/api-filesystem'
// helpers
import { StatusCodes } from 'http-status-codes'
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
  // Init file handler
  const fileHandler = unstable_createFileUploadHandler({
    maxPartSize: maxOpsFileSize,
    file: ({ filename }) => filename || 'upload',
    avoidFileConflicts: false,
    directory: os.tmpdir() + '/' + uuidv4(),
  })
  const memHandler = unstable_createMemoryUploadHandler()
  // The standard file handler skips parts that have no filename in their
  // Content-Disposition (early return before our `file` option is called).
  // Inject a fallback filename for the 'file' part so it is always written
  // to disk and returns a NodeOnDiskFile with a correct .size property.
  const uploadHandler = async (part: any) => {
    if (part.name === 'file') {
      return fileHandler({ ...part, filename: part.filename || 'upload' })
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
    await postFileUpload(accessToken, system, payloadData.path, payloadData.file, originalFileName)
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
