/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from '@remix-run/react'
import {
  CalendarIcon,
  ClockIcon,
  XMarkIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline'
// types
import { Job, JobStateStatus, SystemJob } from '~/types/api-job'
// helpers
import { classNames } from '~/helpers/class-helper'
import { formatTime } from '~/helpers/time-helper'
import { formatDateTimeFromTimestamp } from '~/helpers/date-helper'
import { jobCanBeCanceled } from '~/modules/compute/helpers/status-helper'
import { sortJobs } from '~/modules/compute/helpers/job-helper'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
import JobStateBadge from '~/modules/compute/components/badges/JobStateBadge'
// alerts
import AlertInfo from '~/components/alerts/AlertInfo'
import AlertWarning from '~/components/alerts/AlertWarning'
// dialogs
import JobDetailsDialog from '~/modules/compute/components/dialogs/JobDetailsDialog'
import JobCancelDialog from '~/modules/compute/components/dialogs/JobCancelDialog'
// tooltips
import SimpleTooltip from '~/components/tooltips/SimpleTooltip'
// apis
import { getLocalJobs } from '~/apis/compute-api'
// types
import type { GetSystemJobsResponse } from '~/types/api-job'
// contexts
import { useSystem } from '~/contexts/SystemContext'
import { useGroup } from '~/contexts/GroupContext'
import { useRefreshing } from '~/contexts/RefreshingContext'
// alerts
import AlertError from '~/components/alerts/AlertError'

const UnavailableSystemAlert: React.FC<any> = ({ unavailableSystems, className = '' }) => {
  if (!unavailableSystems || unavailableSystems.length <= 0) {
    return null
  }
  return (
    <AlertWarning className={classNames('', className)} title='System/s NOT available'>
      <p>The following systems are currently unavailable for interaction:</p>
      <ul className='list-disc list-inside'>
        {unavailableSystems.map((unavailableSystem: any, index: number) => (
          <li key={index}>{unavailableSystem.name}</li>
        ))}
      </ul>
      <p className='pt-2'>
        You wan&apos;t be able to view or manage jobs running on these systems at the moment. Please
        check again later or contact support for further assistance.
      </p>
    </AlertWarning>
  )
}

interface JobTableRowProps {
  job: Job
  system: string
  account: string
  user: string
}

enum DisplayField {
  clusterName,
}

interface JobListItemProps {
  job: Job
  hideFields: [DisplayField] | []
}

const mustHideField = (field: DisplayField, hideFields: [DisplayField] | []) => {
  if (!hideFields || hideFields.length == 0 || !hideFields.includes(field)) {
    return false
  }
  return true
}

const JobTableRow: React.FC<JobTableRowProps> = ({
  system,
  job,
  account,
  user,
}: JobTableRowProps) => {
  const navigate = useNavigate()
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  const goToDetails = (jobId: number) => {
    navigate(`/compute/systems/${system}/accounts/${account}/jobs/${jobId}`)
  }

  return (
    <tr className='border-b border-gray-100'>
      <td className='py-3 align-top tabular-nums text-gray-700'>
        <div>
          <JobStateBadge status={job.status} />
        </div>
        <div className='flex items-center text-xs text-gray-500 mb-1'>
          <CalendarIcon aria-hidden='true' className='mr-1 h-4 w-4 flex-shrink-0 text-gray-500' />
          {formatDateTimeFromTimestamp({ timestamp: job.time.start })}
        </div>
        <div className='flex items-center text-xs text-gray-500'>
          <ClockIcon aria-hidden='true' className='mr-1 h-4 w-4 flex-shrink-0 text-gray-500' />
          {formatTime({ time: job.time.elapsed })}
        </div>
      </td>
      <td className='py-3 align-top tabular-nums text-gray-700'>
        <button
          type='button'
          onClick={() => goToDetails(job.jobId)}
          className='truncate font-medium text-gray-900 mb-3 text-sm cursor-pointer hover:underline text-left'
        >
          {job.name}
        </button>

        <div className='truncate text-gray-500 text-xs mb-1'>Job Id: {job.jobId}</div>
      </td>
      <td className='py-3 align-top tabular-nums text-gray-700'>
        {job.user !== '' ? (
          <LabelBadge color={LabelColor.BLUE}>{job.user}</LabelBadge>
        ) : (
          <LabelBadge color={LabelColor.GRAY}>undefined</LabelBadge>
        )}
      </td>
      <td className='py-3 align-top tabular-nums text-gray-700'>
        {(job.status.state === JobStateStatus.RUNNING ||
          job.status.state === JobStateStatus.COMPLETED) && (
          <>
            <div className='truncate text-gray-500 text-xs mb-1'>Partition: {job.partition}</div>
          </>
        )}
        {job.status.state === 'PENDING' && (
          <>
            <div className='truncate text-gray-500 text-xs mb-1'>
              Pending reason: {job.status.stateReason}
            </div>
          </>
        )}
      </td>
      <td className='py-3 align-top text-right'>
        <JobDetailsDialog
          job={job}
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
        />
        <JobCancelDialog
          job={job}
          system={system}
          account={account}
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
        />
        <span className='isolate inline-flex rounded-md shadow-sm'>
          {jobCanBeCanceled(job) && (
            <SimpleTooltip message={`Cancel`} className='right-0 top-9'>
              <button
                onClick={() => setCancelDialogOpen(true)}
                type='button'
                className='relative -ml-px inline-flex items-center bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10'
              >
                <span className='sr-only'>Cancel</span>
                <XMarkIcon aria-hidden='true' className='h-5 w-5' />
              </button>
            </SimpleTooltip>
          )}
          <SimpleTooltip message={`Go to details`} className='right-0 top-9'>
            <button
              onClick={() => goToDetails(job.jobId)}
              type='button'
              className='relative -ml-px inline-flex items-center rounded-r-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10'
            >
              <span className='sr-only'>Go to details</span>
              <CommandLineIcon aria-hidden='true' className='h-5 w-5' />
            </button>
          </SimpleTooltip>
        </span>
      </td>
    </tr>
  )
}

const JobsTable: React.FC<any> = ({ jobs, systemName }: any) => {
  if (jobs.length <= 0) {
    return <AlertInfo message='Job/s not found' />
  }
  return (
    <>
      <table className='w-full whitespace-nowrap text-left text-sm leading-6'>
        <colgroup>
          <col className='lg:w-3/12' />
          <col className='lg:w-3/12' />
          <col className='lg:w-3/12' />
          <col className='lg:w-3/12' />
          <col className='lg:w-3/12' />
        </colgroup>
        <thead className='border-b border-gray-200 text-gray-900'>
          <tr>
            <th scope='col' className='px-0 py-3 font-semibold'>
              Status
            </th>
            <th scope='col' className='px-0 py-3 font-semibold'>
              Job
            </th>
            <th scope='col' className='px-0 py-3 font-semibold'>
              User
            </th>
            <th scope='col' className='px-0 py-3 font-semibold'>
              Info
            </th>
            <th scope='col' className='px-0 py-3 font-semibold'></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job: Job) => (
            <JobTableRow
              system={systemName}
              key={`${job.jobId}`}
              job={job}
              account={job.account}
              user={job.user}
            />
          ))}
        </tbody>
      </table>
    </>
  )
}

type SystemJobListProps = {
  jobs: GetSystemJobsResponse
}

const SystemJobList: React.FC<SystemJobListProps> = ({ jobs }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialAllUsers = searchParams.get('allUsers') === 'true'
  const [allUsers, setAllUsers] = useState<boolean>(jobs?.allUsers ?? initialAllUsers)
  const [localError, setLocalError] = useState<any>(jobs?.error ?? null)
  const { selectedSystem } = useSystem()
  const { selectedGroup } = useGroup()
  const { setRefreshing } = useRefreshing()
  const [currentJobs, setCurrentJobs] = useState<Job[]>(sortJobs(jobs?.jobs ?? []))

  const onChangeHandler = async (event: any) => {
    // window.location.href = `/compute/systems/${jobs.system}/accounts/${jobs.account}?allUsers=${event.currentTarget.checked}`
    const checked = event.currentTarget.checked
    setAllUsers(checked)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('allUsers', String(checked))
      return next
    })
    // Trigger immediate fetch for instant feedback with the new value
    await fetchJobs(checked)
  }

  const fetchJobs = async (allUsersOverride?: boolean) => {
    try {
      setRefreshing(true, 'Refreshing jobs...')
      const startTime = Date.now()

      const response = await getLocalJobs(
        selectedSystem?.name ?? '',
        selectedGroup?.name ?? '',
        allUsersOverride !== undefined ? allUsersOverride : allUsers,
      )

      setCurrentJobs(sortJobs(response?.jobs ?? []))
      setLocalError(null)

      // Ensure minimum display time of 300ms to avoid flickering
      const elapsed = Date.now() - startTime
      const minDisplayTime = 300
      if (elapsed < minDisplayTime) {
        await new Promise((resolve) => setTimeout(resolve, minDisplayTime - elapsed))
      }
    } catch (error) {
      setLocalError(error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const intervalId = setInterval(fetchJobs, 2000)
    return () => clearInterval(intervalId)
  }, [selectedSystem?.name, selectedGroup?.name, allUsers])

  return (
    <>
      <AlertError error={localError} />
      <div className='pt-2 pb-4'>
        <label className='inline-flex items-center cursor-pointer'>
          <input
            type='checkbox'
            defaultChecked={allUsers}
            value=''
            className='sr-only peer'
            onChange={onChangeHandler}
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
          <span className='ms-3 text-sm font-medium text-gray-900 dark:text-gray-300'>All users</span>
        </label>
      </div>
      <JobsTable jobs={currentJobs ?? []} systemName={selectedSystem?.name || ''} />
    </>
  )
}

export default SystemJobList
