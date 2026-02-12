/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
import { ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline'
// helpers
import { classNames } from '~/helpers/class-helper'

interface RefreshingIndicatorProps {
  isRefreshing: boolean
  text?: string
  className?: string
  iconClassName?: string
  textClassName?: string
}

const RefreshingIndicator: React.FC<RefreshingIndicatorProps> = ({
  isRefreshing,
  text = 'Refreshing...',
  className = '',
  iconClassName = '',
  textClassName = '',
}) => {
  if (!isRefreshing) {
    return null
  }

  return (
    <div className={classNames('inline-flex items-center text-xs text-gray-500', className)}>
      <ArrowPathRoundedSquareIcon
        className={classNames('mr-1.5 h-4 w-4 animate-spin text-red-500', iconClassName)}
        aria-hidden='true'
      />
      <span className={textClassName}>{text}</span>
    </div>
  )
}

export default RefreshingIndicator
