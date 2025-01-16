import os from 'os';
import {v4 as uuidv4} from 'uuid';

import type { ActionFunction, ActionFunctionArgs } from '@remix-run/node'
import {
  unstable_composeUploadHandlers,
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
// validation
import { validateFileUpload } from '~/validations/filesystemValidation'
// config
import uiConfig from '~/configs/ui.config'

export const action: ActionFunction = async ({ params, request }: ActionFunctionArgs) => {
  // Create a headers object
  const headers = new Headers()
  // Authenticate the request and get the accessToken back, this will be the
  // already saved token or the refreshed one, in that case the headers above
  // will have the Set-Cookie header appended
  const accessToken = await getAuthAccessToken(request, headers)
  // Init file handler
  const uploadHandler = unstable_composeUploadHandlers(
    unstable_createFileUploadHandler({
      maxPartSize: uiConfig.fileUploadLimit,
      file: ({ filename }) => filename,
      avoidFileConflicts: false,
      directory: 	os.tmpdir() + "/" + uuidv4() 
    }),
    unstable_createMemoryUploadHandler(),
  )
  // Get form data
  const formData = await unstable_parseMultipartFormData(request, uploadHandler)
  try {
    // Get path params
    const system: string = params.system || ''
    // Validate
    const payloadData: PostFileUploadPayload = await validateFileUpload(formData)
    // Post data
    await postFileUpload(accessToken, system, payloadData.path, payloadData.file)
    // Notify success message
    await notifySuccessMessage(
      {
        title: 'File upload',
        text: `File "${payloadData.file.name}" have been upload successfully at the target path "${payloadData.path}"`,
      },
      request,
      headers,
    )
    // Return response
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
