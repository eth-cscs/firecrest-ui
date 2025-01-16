import { StatusCodes } from 'http-status-codes'
import type { ActionFunction, ActionFunctionArgs } from '@remix-run/node'
// types
import { PostTransferUploadRequest } from '~/types/api-filesystem'
// helpers
import { notifySuccessMessage } from '~/helpers/notification-helper'
import { handleApiErrorResponse, handleSuccessResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { postTransferUpload } from '~/apis/filesystem-api'
// validations
import { validateTransferUpload } from '~/validations/filesystemTransferValidation'

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
    const payloadData: PostTransferUploadRequest = await validateTransferUpload(formData)
    // Put data
    const response = await postTransferUpload(
      accessToken,
      system,
      payloadData.path,
      payloadData.fileName,
    )
    // Return response
    return handleSuccessResponse(response, StatusCodes.OK, headers)
  } catch (error) {
    return handleApiErrorResponse(error)
  }
}
