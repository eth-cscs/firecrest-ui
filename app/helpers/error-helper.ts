/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// types
import { ErrorType } from '~/types/error'

export const getErrorFromData = (data: any) => {
  if (data && data?.error) {
    return data.error
  }
  return null
}

export const getFormErrorFieldsFromError = (error: any) => {
  if (error && error?.type && error.type === ErrorType.validation) {
    return error.fields
  }
  return null
}
