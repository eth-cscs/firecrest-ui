/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import _ from 'lodash'
import React, { useState } from 'react'
import prettyMilliseconds from 'pretty-ms'
import {
  CheckCircleIcon,
  XCircleIcon,
  ServerStackIcon,
  ExclamationCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
// types
import { SystemHealtyStatus, type System, ServiceHealth, ServiceType } from '~/types/api-status'
// helpers
import { classNames } from '~/helpers/class-helper'
import { formatDateTime } from '~/helpers/date-helper'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
import ServiceHealthStatusBadge from '~/modules/status/components/badges/ServiceHealthStatusBadge'
// data
import { isSystemHealthy } from '~/helpers/system-helper'
import ServiceHealthDetailsDialog from '../dialogs/ServiceHealthDetailsDialog'

interface SystemStatusStatProps {
  system: System
  viewAllByDefault?: boolean
}

// TODO: Move to a separate file
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

interface SystemHealtyDetailRowProps {
  system: System
  serviceHealth: ServiceHealth
}

const ServiceHealthItemRow: React.FC<SystemHealtyDetailRowProps> = ({
  system,
  serviceHealth,
}: SystemHealtyDetailRowProps) => {
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  return (
    <>
      <tr key={serviceHealth.serviceType}>
        <td className='whitespace-nowrap py-1 pl-4 pr-3 text-sm sm:pl-0'>
          <ServiceHealthStatusBadge serviceHealth={serviceHealth} />
        </td>
        <td className='whitespace-nowrap py-1 pl-4 pr-3 text-sm sm:pl-0'>
          <div className='flex'>
            <div className=''>
              <div className='font-medium text-gray-900'>{serviceHealth.serviceType}</div>
              {serviceHealth.serviceType == ServiceType.scheduler && (
                <div className='text-gray-500 text-xs'>
                  available {serviceHealth.nodes?.available} of {serviceHealth.nodes?.total}
                </div>
              )}
              {serviceHealth.serviceType == ServiceType.filesystem && (
                <div className='text-gray-500 text-xs'>{serviceHealth.path}</div>
              )}
              {serviceHealth.serviceType == ServiceType.ssh && (
                <div className='text-gray-500 text-xs'>port {system.ssh.port}</div>
              )}
            </div>
          </div>
        </td>
        <td className='whitespace-nowrap px-3 py-1 text-sm text-gray-500'>
          <div>latency {prettyMilliseconds(serviceHealth.latency * 1000)}</div>
          <div className='text-gray-500 text-xs'>
            last check{' '}
            {formatDateTime({
              dateTime: serviceHealth.lastChecked,
              format: 'YYYY-MM-DD HH:mm:ss',
            })}
          </div>
        </td>
        <td className='whitespace-nowrap px-3 py-1 text-sm text-gray-500'>
          {serviceHealth.message != null && (
            <>
              <button
                type='button'
                onClick={() => setDetailsDialogOpen(true)}
                className='relative inline-flex items-center gap-x-1.5 rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
              >
                <EyeIcon className='-ml-0.5 h-5 w-3' aria-hidden='true' />
                <div>Inspect</div>
              </button>
            </>
          )}
          <ServiceHealthDetailsDialog
            serviceHealthMessage={serviceHealth.message}
            open={detailsDialogOpen}
            onClose={() => setDetailsDialogOpen(false)}
          />
        </td>
      </tr>
    </>
  )
}

interface SystemHealthDetailTableProps {
  system: System
  servicesHealth: ServiceHealth[]
  className?: string
}

const SystemHealthDetailTable: React.FC<SystemHealthDetailTableProps> = ({
  system,
  servicesHealth,
  className = '',
}: SystemHealthDetailTableProps) => {
  return (
    <div className='px-4 sm:px-6 lg:px-8'>
      <div className='mt-8 flow-root'>
        <div className='-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8'>
          <div className='inline-block min-w-full align-middle'>
            <table className='min-w-full divide-y divide-gray-300'>
              <thead>
                <tr>
                  <th
                    scope='col'
                    className='py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0'
                  >
                    Status
                  </th>
                  <th
                    scope='col'
                    className='py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0'
                  >
                    Service
                  </th>
                  <th
                    scope='col'
                    className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                  >
                    Health check details
                  </th>
                  <th
                    scope='col'
                    className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                  >
                    System data
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 bg-white'>
                {servicesHealth.map((serviceHealth: ServiceHealth) => (
                  <ServiceHealthItemRow
                    key={serviceHealth.serviceType}
                    serviceHealth={serviceHealth}
                    system={system}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

const SystemStatusStat: React.FC<SystemStatusStatProps> = ({
  system,
  viewAllByDefault = false,
}: SystemStatusStatProps) => {
  const [viewAll, setViewAll] = useState(viewAllByDefault)
  const { name, ssh, scheduler, servicesHealth, probing } = system

  return (
    <div className='relative overflow-hidden rounded-lg bg-white px-4 pb-20 pt-5 shadow sm:px-6 sm:pt-6'>
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
      {viewAll && <SystemHealthDetailTable system={system} servicesHealth={servicesHealth} />}
      <div className='absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6'>
        <div className='text-sm'>
          <button
            onClick={() => setViewAll(!viewAll)}
            className='font-medium text-gray-600 hover:text-gray-500'
          >
            {viewAll ? 'Hide' : 'More information'}
          </button>
        </div>
      </div>
    </div>
  )
}

const SystemsStatusStatList: React.FC<any> = ({ systems }) => {
  return (
    <div className='mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 items-start'>
      {systems &&
        systems.length > 0 &&
        systems.map((system: any, index: number) => (
          <SystemStatusStat system={system} key={system.name} />
        ))}
    </div>
  )
}

const SystemsStatusStat: React.FC<any> = ({ systems, className = '' }: any) => {
  return (
    <div className={classNames('mb-4', className)}>
      <h3 className='text-base font-semibold leading-6 text-gray-900'>Systems status</h3>
      <SystemsStatusStatList systems={systems} />
    </div>
  )
}

export default SystemsStatusStat
