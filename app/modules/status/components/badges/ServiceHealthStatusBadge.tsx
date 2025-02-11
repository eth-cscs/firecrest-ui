/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { CheckCircleIcon, CheckIcon, XCircleIcon } from '@heroicons/react/24/outline'
// types
import { ServiceHealth } from '~/types/api-status'
// helpers
import { classNames } from '~/helpers/class-helper'

interface ServiceHealthStatusBadgeProps {
  serviceHealth: ServiceHealth
  className?: string
}

const ServiceHealthStatusBadge: React.FC<ServiceHealthStatusBadgeProps> = ({
  serviceHealth,
  className = '',
}: ServiceHealthStatusBadgeProps) => {
  if (serviceHealth.healthy) {
    return (
      <span
        className={classNames(
          'inline-flex items-center gap-x-1.5 rounded-md bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20',
          className || '',
        )}
      >
        <CheckIcon className='w-4 h-4 text-green-700' aria-hidden='true' />
        <span className={`text-xs font-medium text-green-700`}>Healthy</span>
      </span>
    )
  }
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-x-1.5 rounded-md bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20',
        className || '',
      )}
    >
      <XCircleIcon className='w-4 h-4 text-red-700' aria-hidden='true' />
      <span className={`text-xs font-medium text-red-700`}>Unhealthy</span>
    </span>
  )
}

export default ServiceHealthStatusBadge
