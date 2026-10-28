/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
import {
  CheckCircleIcon,
  ClockIcon,
  PauseCircleIcon,
  QuestionMarkCircleIcon,
  StopCircleIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid'
// helpers
import { classNames } from '~/helpers/class-helper'
// types
import type { RlRunStatus } from '~/types/ai-training'

// Full class names, so that Tailwind keeps them
const STYLES: Record<RlRunStatus, { label: string; className: string; icon: React.ElementType }> = {
  completed: {
    label: 'Completed',
    className: 'bg-green-50 text-green-700 ring-green-600/20',
    icon: CheckCircleIcon,
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
    icon: XCircleIcon,
  },
  terminated: {
    label: 'Terminated',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    icon: StopCircleIcon,
  },
  preempted: {
    label: 'Preempted',
    className: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    icon: PauseCircleIcon,
  },
  running: {
    label: 'Running',
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    icon: ClockIcon,
  },
  unknown: {
    label: 'Unknown',
    className: 'bg-gray-50 text-gray-600 ring-gray-500/20',
    icon: QuestionMarkCircleIcon,
  },
}

interface RLRunStatusBadgeProps {
  status: RlRunStatus
  className?: string
}

const RLRunStatusBadge: React.FC<RLRunStatusBadgeProps> = ({ status, className }) => {
  const { label, className: statusClassName, icon: Icon } = STYLES[status]
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-x-1 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        statusClassName,
        className ?? '',
      )}
    >
      <Icon aria-hidden='true' className='h-4 w-4' />
      {label}
    </span>
  )
}

export default RLRunStatusBadge
