/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
// helpers
import { classNames } from '~/helpers/class-helper'
// buttons
import LoadingButton from './LoadingButton'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

const LoadMoreButton: React.FC<any> = ({
  isLoading,
  total,
  limit,
  current,
  onClick = () => {},
  className,
  buttonName = 'Load more',
}: any) => {
  if (current * limit < total) {
    return (
      <LoadingButton
        isLoading={isLoading}
        className={classNames('w-full justify-center sm:text-sm', className)}
      >
        <button
          className={classNames(
            !isLoading ? '' : 'opacity-50 cursor-not-allowed',
            'w-full inline-flex items-center gap-x-1.5 justify-center rounded-md bg-transparent border border-blue-600 py-2 px-4 text-sm font-medium text-blue-700 shadow-sm hover:text-white hover:bg-blue-600',
          )}
          disabled={isLoading}
          onClick={onClick}
        >
          <ArrowPathIcon className='-ml-0.5 h-5 w-5' aria-hidden='true' />
          {buttonName} (Total: {total} / Visible:{' '}
          {current * limit > total ? total : current * limit})
        </button>
      </LoadingButton>
    )
  }
  return null
}

export default LoadMoreButton
