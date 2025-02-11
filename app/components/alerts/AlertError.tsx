/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { XCircleIcon } from '@heroicons/react/24/outline'
// types
import { ErrorType } from '~/types/error'
import type { ValidationErrorResponse } from '~/types/error'

const AlertError: React.FC<any> = ({ error, errorActions, className }: any) => {
  if (!error || error === null) {
    return null
  }

  let validationErrorElement = null
  if (error?.type && error.type === ErrorType.validation) {
    const validationError: ValidationErrorResponse = error
    validationErrorElement = (
      <div className='mt-2 text-sm text-red-700'>
        <ul className='list-disc space-y-1 pl-5'>
          {validationError.fields.map(function (errorField) {
            return <li key={errorField.name}>{errorField.message}</li>
          })}
        </ul>
      </div>
    )
  }

  return (
    <div className='rounded-md bg-red-50 p-4 mb-5'>
      <div className='flex'>
        <div className='flex-shrink-0'>
          <XCircleIcon className='h-5 w-5 text-red-400' aria-hidden='true' />
        </div>
        <div className='ml-3'>
          <h3 className='text-sm font-medium text-red-800'>{error.message}</h3>
          {validationErrorElement && validationErrorElement}
        </div>
      </div>
      {errorActions !== undefined && errorActions && { errorActions }}
    </div>
  )
}

export default AlertError
