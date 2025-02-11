/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

export enum ErrorType {
  error = 'error',
  validation = 'validation',
  http = 'http',
}

export interface ErrorResponse {
  type: ErrorType
  message: string
  error?: any
}

export interface ValidationErrorResponse extends ErrorResponse {
  fields: Array<any>
}

export interface HttpErrorResponse extends ErrorResponse {
  statusCode: number
  data?: any
}
