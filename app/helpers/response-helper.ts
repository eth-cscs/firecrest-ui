/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { ValidationError } from 'yup'
import { StatusCodes } from 'http-status-codes'
// types
import { ErrorType } from '~/types/error'
import type { HttpErrorResponse, ValidationErrorResponse } from '~/types/error'
// helpers
import { prettyBytes } from './file-helper'

// react-router v7 dropped the built-in multipart upload handlers along with
// MaxPartSizeExceededError; upload routes now use @mjackson/form-data-parser,
// whose MaxFileSizeExceededError doesn't carry the byte count, so upload routes
// catch it and construct this instead to keep the existing error response shape.
export class MaxPartSizeExceededError extends Error {
  maxBytes: number
  constructor(maxBytes: number) {
    super(`Part exceeded maximum allowed size of ${maxBytes} bytes`)
    this.maxBytes = maxBytes
  }
}

// Success responses
export const handleSuccessResponse = (
  data: any,
  statusCode: number = StatusCodes.OK,
  headers: Headers | null = null,
) => {
  if (headers !== null) {
    if (statusCode === StatusCodes.NO_CONTENT) {
      return new Response(null, { status: statusCode, headers })
    }
    return Response.json(data, { status: statusCode, headers: headers })
  }
  if (statusCode === StatusCodes.NO_CONTENT) {
    return new Response(null, { status: statusCode })
  }
  return Response.json(data, { status: statusCode })
}

const _errorResponse = (data: any, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR) => {
  return Response.json(
    {
      error: data,
    },
    { status: statusCode },
  )
}

const handleValidationErrorResponse = (error: ValidationError) => {
  const response: ValidationErrorResponse = buildValidationErrorResponseFromValidationError(error)
  return _errorResponse(response, StatusCodes.BAD_REQUEST)
}

const handleMaxPartSizeExceededErrorResponse = (error: MaxPartSizeExceededError) => {
  const response: ValidationErrorResponse = buildMaxPartSizeExceededErrorResponse(error)
  return _errorResponse(response, StatusCodes.BAD_REQUEST)
}

const handleHttpErrorResponse = async (
  error: Response,
  handlingThreshold: StatusCodes | null = StatusCodes.INTERNAL_SERVER_ERROR,
) => {
  if (handlingThreshold !== null && error.status >= handlingThreshold) {
    throw error
  }
  const response: HttpErrorResponse = await buildHttpErrorResponseFromResponse(error)
  return _errorResponse(response, error.status)
}

export const handleErrorResponse = (
  error: any,
  handlingThreshold: StatusCodes | null = StatusCodes.INTERNAL_SERVER_ERROR,
) => {
  // Validation http error
  if (error instanceof ValidationError) {
    return handleValidationErrorResponse(error)
  }
  // Max part size exceeded error
  if (error instanceof MaxPartSizeExceededError) {
    return handleMaxPartSizeExceededErrorResponse(error)
  }
  // Response error
  if (error instanceof Response) {
    return handleHttpErrorResponse(error, handlingThreshold)
  }
  // Throw error (error)
  throw error
}

export const handleFormErrorResponse = (error: any) => {
  return handleErrorResponse(error, null)
}

export const handleApiErrorResponse = (error: any) => {
  return handleErrorResponse(error, null)
}

export const buildValidationErrorResponseFromValidationError = (error: ValidationError) => {
  const { inner } = error
  const response: ValidationErrorResponse = {
    type: ErrorType.validation,
    message: `${inner.length} validation error/s occurred`,
    error: error,
    // Validation error fields below
    fields: [],
  }
  inner.forEach((error: ValidationError) => {
    if (error.path) {
      const errorMessage = error.message.replace('body.', '')
      response.fields.push({
        location: 'body',
        name: error.path,
        value: error.value,
        message: errorMessage,
      })
    }
  })
  return response
}

export const buildMaxPartSizeExceededErrorResponse = (error: MaxPartSizeExceededError) => {
  const { maxBytes } = error
  const response: ValidationErrorResponse = {
    type: ErrorType.validation,
    message: `The file exceeded upload size of ${prettyBytes(maxBytes)}.`,
    error: error,
    fields: [],
  }
  return response
}

export const buildHttpErrorResponseFromResponse = async (error: Response) => {
  const message = await error.text()
  const response: HttpErrorResponse = {
    type: ErrorType.http,
    message: message,
    statusCode: error.status,
  }
  return response
}
