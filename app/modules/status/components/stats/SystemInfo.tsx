/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import _ from 'lodash'
import React from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ServerStackIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
// types
import { SystemHealtyStatus, type System } from '~/types/api-status'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
// helpers
import { isSystemHealthy } from '~/helpers/system-helper'

interface SystemHealtyStatusBadgeProps {
  system: System
  className?: string
}

const SystemHealtyStatusBadge: React.FC<SystemHealtyStatusBadgeProps> = ({
  system,
  className = '',
}: SystemHealtyStatusBadgeProps) => {
  const systemHealthyStatus = isSystemHealthy(system)
  if (systemHealthyStatus === SystemHealtyStatus.healthy) {
    return (
      <p className='ml-2 flex items-baseline text-sm text-green-600 font-semibold'>
        <CheckCircleIcon
          className='h-5 mr-1 w-5 flex-shrink-0 self-center text-green-500'
          aria-hidden='true'
        />
        Healthy
      </p>
    )
  }
  if (systemHealthyStatus === SystemHealtyStatus.unhealthy) {
    return (
      <p className='ml-2 flex items-baseline text-sm text-red-600 font-semibold'>
        <XCircleIcon
          className='h-5 mr-1 w-5 flex-shrink-0 self-center text-red-500'
          aria-hidden='true'
        />
        Unhealthy
      </p>
    )
  }
  return (
    <p className='ml-2 flex items-baseline text-sm text-yellow-600 font-semibold'>
      <ExclamationCircleIcon
        className='h-5 mr-1 w-5 flex-shrink-0 self-center text-yellow-500'
        aria-hidden='true'
      />
      Degraded
    </p>
  )
}

interface SystemInfoProps {
  system: System
}

const SystemInfo: React.FC<SystemInfoProps> = ({ system }: SystemInfoProps) => {
  const { scheduler, name, ssh } = system
  return (
    <div>
      <div className='absolute rounded-md bg-blue-500 p-3'>
        <ServerStackIcon className='h-6 w-6 text-white' aria-hidden='true' />
      </div>
      <div className='ml-16 flex items-baseline'>
        <p className='text-2xl font-semibold text-gray-900 -mt-1'>{name}</p>
        <SystemHealtyStatusBadge system={system} />
      </div>
      <div className='ml-16 text-sm font-medium text-gray-500'>
        <span className='capitalize'>{scheduler.type}</span>&nbsp;
        <LabelBadge color={LabelColor.BLUE}>{scheduler.version}</LabelBadge>
        &nbsp;&bull;&nbsp;<span>Hostname</span>&nbsp;
        <LabelBadge color={LabelColor.BLUE}>{ssh.host}</LabelBadge>
      </div>
    </div>
  )
}

export default SystemInfo
