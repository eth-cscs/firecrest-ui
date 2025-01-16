import { StatusCodes } from 'http-status-codes'
import type { ActionFunction, ActionFunctionArgs } from '@remix-run/node'
// types
import { PostTransferMvRequest } from '~/types/api-filesystem'
// helpers
import { notifySuccessMessage } from '~/helpers/notification-helper'
import { handleApiErrorResponse, handleSuccessResponse } from '~/helpers/response-helper'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { postTransferMv } from '~/apis/filesystem-api'
// validations
import { validateTransferMv } from '~/validations/filesystemTransferValidation'

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
    const payloadData: PostTransferMvRequest = await validateTransferMv(formData)
    // Put data
    const response = await postTransferMv(
      accessToken,
      system,
      payloadData.sourcePath,
      payloadData.targetPath,
    )
    // Notify success message
    await notifySuccessMessage(
      {
        title: 'Move operation submitted',
        text: `The move operation from the source path "${payloadData.sourcePath}" to the destination path  "${payloadData.targetPath}" 
        has been successfully submitted. As soon as the operation is complete, you will be able to see the changes in the file system.`,
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
