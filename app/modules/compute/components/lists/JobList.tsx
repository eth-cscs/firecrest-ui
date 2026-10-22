/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useState, useEffect } from 'react'
import { useNavigate, useFetcher } from 'react-router'
import {
  CalendarIcon,
  ClockIcon,
  XMarkIcon,
  CommandLineIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
// types
import { Job, JobStateStatus, SystemJob } from '~/types/api-job'
// helpers
import { formatTime } from '~/helpers/time-helper'
import { formatDateTimeFromTimestamp } from '~/helpers/date-helper'
import { jobCanBeCanceled } from '~/modules/compute/helpers/status-helper'
import {
  sortJobs,
  normalizeJobNameFilter,
  JOB_NAME_FILTER_MAX_LENGTH,
} from '~/modules/compute/helpers/job-helper'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
import JobStateBadge from '~/modules/compute/components/badges/JobStateBadge'
// alerts
import AlertInfo from '~/components/alerts/AlertInfo'
// dialogs
import JobDetailsDialog from '~/modules/compute/components/dialogs/JobDetailsDialog'
import JobCancelDialog from '~/modules/compute/components/dialogs/JobCancelDialog'
// tooltips
import SimpleTooltip from '~/components/tooltips/SimpleTooltip'
// buttons
import CopyToClipboardButton from '~/components/buttons/CopyToClipboardButton'
// apis
import { isMaintenancePayload, getMaintenancePayloadMessage } from '~/apis/api'
// types
import type { GetSystemJobsResponse } from '~/types/api-job'
import type { MaintenancePayload } from '~/apis/api'
// contexts
import { useSystem } from '~/contexts/SystemContext'
import { useGroup } from '~/contexts/GroupContext'
import { useRefreshing } from '~/contexts/RefreshingContext'
import { useMaintenance } from '~/contexts/MaintenanceContext'
// alerts
import AlertError from '~/components/alerts/AlertError'
// spinners
import LoadingSpinner from '~/components/spinners/LoadingSpinner'

interface JobTableRowProps {
  job: Job
  system: string
  account: string
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

// Shared between the desktop Job column and the mobile-only stacked summary folded into the
// Status cell, so the two don't drift out of sync (and there's one place to fix, e.g. the
// PENDING check below using the enum instead of a stray string literal).
const JobNameAndId: React.FC<{ job: Job; onGoToDetails: () => void }> = ({
  job,
  onGoToDetails,
}) => (
  <>
    {/* min-w-0 + truncate on the text (not the row) so long names still get an ellipsis while
        the copy icon next to them stays visible. */}
    <div className='flex min-w-0 items-center gap-1 mb-3'>
      <button
        type='button'
        onClick={onGoToDetails}
        className='min-w-0 truncate font-medium text-gray-900 text-sm cursor-pointer hover:underline text-left'
      >
        {job.name}
      </button>
      <CopyToClipboardButton value={job.name} label='Copy job name' />
    </div>
    <div className='flex min-w-0 items-center gap-1 text-gray-500 text-xs mb-1'>
      <span className='truncate'>Job Id: {job.jobId}</span>
      <CopyToClipboardButton value={job.jobId} label='Copy job ID' />
    </div>
  </>
)

const JobUserBadge: React.FC<{ job: Job }> = ({ job }) =>
  job.user !== '' ? (
    <LabelBadge color={LabelColor.BLUE}>{job.user}</LabelBadge>
  ) : (
    <LabelBadge color={LabelColor.GRAY}>N/A</LabelBadge>
  )

const JobPartitionOrPendingReason: React.FC<{ job: Job }> = ({ job }) => (
  <>
    {(job.status.state === JobStateStatus.RUNNING ||
      job.status.state === JobStateStatus.COMPLETED) && (
      <div className='truncate text-gray-500 text-xs mb-1'>Partition: {job.partition}</div>
    )}
    {job.status.state === JobStateStatus.PENDING && (
      <div className='truncate text-gray-500 text-xs mb-1'>
        Pending reason: {job.status.stateReason}
      </div>
    )}
  </>
)

const JobTableRow: React.FC<JobTableRowProps> = ({
  system,
  job,
  account,
}: JobTableRowProps) => {
  const navigate = useNavigate()
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  const goToDetails = (jobId: string) => {
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
          <span className='truncate min-w-0'>
            {formatDateTimeFromTimestamp({ timestamp: job.time.start })}
          </span>
        </div>
        <div className='flex items-center text-xs text-gray-500'>
          <ClockIcon aria-hidden='true' className='mr-1 h-4 w-4 flex-shrink-0 text-gray-500' />
          <span className='truncate min-w-0'>{formatTime({ time: job.time.elapsed })}</span>
        </div>
        {/* Below lg, the Job/User/Info columns are hidden - fold their content in here instead
            of losing it, so mobile/tablet stays a 2-column layout (this cell + actions). Cuts
            in at lg rather than md because the persistent sidebar (md:w-64) also appears at md,
            eating ~256px right when a narrower breakpoint would otherwise try to fit 5 columns
            into whatever's left. */}
        <div className='lg:hidden mt-3'>
          <JobNameAndId job={job} onGoToDetails={() => goToDetails(job.jobId)} />
          <div className='mb-1'>
            <JobUserBadge job={job} />
          </div>
          <JobPartitionOrPendingReason job={job} />
        </div>
      </td>
      <td className='hidden lg:table-cell py-3 align-top tabular-nums text-gray-700'>
        <JobNameAndId job={job} onGoToDetails={() => goToDetails(job.jobId)} />
      </td>
      <td className='hidden lg:table-cell py-3 align-top tabular-nums text-gray-700'>
        <JobUserBadge job={job} />
      </td>
      <td className='hidden lg:table-cell py-3 align-top tabular-nums text-gray-700'>
        <JobPartitionOrPendingReason job={job} />
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

const JobsTable: React.FC<any> = ({ jobs, systemName, emptyMessage }: any) => {
  if (jobs.length <= 0) {
    return <AlertInfo message={emptyMessage ?? 'Job/s not found'} />
  }
  return (
    <div className='overflow-x-auto'>
      <table className='w-full table-fixed whitespace-nowrap text-left text-sm leading-6'>
        <colgroup>
          {/* Below lg only the content and actions columns render - give them the full width
              between them so the actions column can't get pushed past the viewport edge. Cuts in
              at lg, not md, because the persistent sidebar also appears at md and eats ~256px -
              revealing more columns at the same breakpoint the sidebar shows up left too little
              room. At lg+, all 5 columns render - these widths sum to 12/12, unlike the original
              lg:w-3/12 on every column (5 x 25% = 125%), which only "worked" because table-auto
              ignored col widths that didn't fit - table-fixed enforces them for real. */}
          <col className='w-[calc(100%-5rem)] lg:w-3/12' />
          <col className='hidden lg:table-column lg:w-4/12' />
          <col className='hidden lg:table-column lg:w-2/12' />
          <col className='hidden lg:table-column lg:w-2/12' />
          <col className='w-20 lg:w-1/12' />
        </colgroup>
        <thead className='border-b border-gray-200 text-gray-900'>
          <tr>
            <th scope='col' className='px-0 py-3 font-semibold'>
              Status
            </th>
            <th scope='col' className='hidden lg:table-cell px-0 py-3 font-semibold'>
              Job
            </th>
            <th scope='col' className='hidden lg:table-cell px-0 py-3 font-semibold'>
              User
            </th>
            <th scope='col' className='hidden lg:table-cell px-0 py-3 font-semibold'>
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
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const JOBS_POLL_INTERVAL_MS = 2000
// Wait for a pause in typing before applying the name filter, so each keystroke doesn't fire a
// backend request (the filter is exact-match, so partial names would just return nothing anyway).
const NAME_FILTER_DEBOUNCE_MS = 500

interface SystemJobListProps {
  // Resolved by the page loader: the URL's allUsers param if present, else the remembered cookie.
  initialAllUsers: boolean
  // From the URL's name param, so a filtered list can be bookmarked/shared.
  initialName: string
}

// Updates one query param for bookmarkability without a React Router navigation - setSearchParams
// would re-run the page loader on every change.
const replaceUrlSearchParam = (key: string, value: string | null) => {
  const url = new URL(window.location.href)
  if (value === null) {
    url.searchParams.delete(key)
  } else {
    url.searchParams.set(key, value)
  }
  window.history.replaceState({}, '', url.toString())
}

const SystemJobList: React.FC<SystemJobListProps> = ({ initialAllUsers, initialName }) => {
  const [allUsers, setAllUsers] = useState<boolean>(initialAllUsers)
  // What's typed in the search box vs. the (debounced, normalized) value actually sent to the API.
  const [nameInput, setNameInput] = useState<string>(initialName)
  const [name, setName] = useState<string>(initialName)
  const { selectedSystem } = useSystem()
  const { selectedGroup } = useGroup()
  const { setRefreshing } = useRefreshing()
  const { setMaintenance } = useMaintenance()
  // useFetcher (rather than a hand-rolled fetch+setState poll) is what makes this safe under a
  // slow/hanging backend: calling .load() again while a previous one for this fetcher is still
  // in flight aborts the stale request, so an old, slow-to-resolve response can never land after
  // and clobber state set by a newer one. Also avoids the deferred/streamed loader response this
  // route used to rely on, which doesn't survive a buffering reverse proxy (e.g. Traefik) well.
  const fetcher = useFetcher<GetSystemJobsResponse | MaintenancePayload>()

  // Takes the system/group names as required parameters (not read from closure) so a caller
  // can't accidentally build a URL with a missing path segment - TypeScript enforces that both
  // are already-validated strings, rather than trusting every call site to check first.
  const buildUrl = (
    systemNameValue: string,
    groupNameValue: string,
    allUsersValue: boolean,
    nameValue: string,
  ) => {
    const query = new URLSearchParams({ allUsers: String(allUsersValue) })
    if (nameValue) {
      query.set('name', nameValue)
    }
    return `/api/compute/systems/${systemNameValue}/accounts/${groupNameValue}/jobs?${query.toString()}`
  }

  const onChangeHandler = (event: any) => {
    const checked = event.currentTarget.checked
    setAllUsers(checked)
    replaceUrlSearchParam('allUsers', String(checked))
    // The effect below re-fetches on the `allUsers` change - no need to trigger it here too.
  }

  // Apply the typed name once typing pauses; the polling effect below re-fetches on `name` change.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const normalized = normalizeJobNameFilter(nameInput)
      setName(normalized)
      replaceUrlSearchParam('name', normalized || null)
    }, NAME_FILTER_DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
  }, [nameInput])

  const clearNameFilter = () => {
    // Clearing is an explicit action - apply it right away rather than waiting for the debounce.
    setNameInput('')
    setName('')
    replaceUrlSearchParam('name', null)
  }

  // Initial load, plus a self-pacing poll: skips a tick while the previous load is still in
  // flight instead of firing every JOBS_POLL_INTERVAL_MS regardless, so a slow backend gets to
  // finish a request rather than having it superseded (and effectively never completing) every
  // time the interval fires. Guarded on both names being populated - system/group briefly
  // resolve after mount (system context, GroupsFetcher), and firing early would poll a
  // malformed URL (missing path segment) until they do.
  useEffect(() => {
    const systemName = selectedSystem?.name
    const groupName = selectedGroup?.name
    if (!systemName || !groupName) return
    fetcher.load(buildUrl(systemName, groupName, allUsers, name))
    const intervalId = setInterval(() => {
      if (fetcher.state === 'idle') {
        fetcher.load(buildUrl(systemName, groupName, allUsers, name))
      }
    }, JOBS_POLL_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [selectedSystem?.name, selectedGroup?.name, allUsers, name])

  useEffect(() => {
    setRefreshing(fetcher.state !== 'idle', 'Refreshing jobs...')
  }, [fetcher.state])

  useEffect(() => {
    if (isMaintenancePayload(fetcher.data)) {
      setMaintenance(true, getMaintenancePayloadMessage(fetcher.data))
    }
  }, [fetcher.data])

  if (!fetcher.data) {
    return <LoadingSpinner title='Loading jobs...' className='py-10' />
  }

  if (isMaintenancePayload(fetcher.data)) {
    // AppLayout swaps to the maintenance page on the next render once setMaintenance() above
    // takes effect - nothing meaningful to render here in the meantime.
    return null
  }

  const jobsData = fetcher.data
  const currentJobs = sortJobs(jobsData?.jobs ?? [])
  const localError = jobsData?.error ?? null
  const emptyMessage = jobsData?.name
    ? `No jobs named "${jobsData.name}" found. The search matches the full job name exactly.`
    : undefined

  return (
    <>
      <AlertError error={localError} />
      <div className='pt-2 pb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative w-full sm:max-w-sm'>
          <label htmlFor='job-name-filter' className='sr-only'>
            Filter by job name
          </label>
          <MagnifyingGlassIcon
            aria-hidden='true'
            className='pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400'
          />
          <input
            id='job-name-filter'
            type='search'
            value={nameInput}
            maxLength={JOB_NAME_FILTER_MAX_LENGTH}
            placeholder='Filter by exact job name'
            title='Shows only jobs whose name matches exactly'
            onChange={(event) => setNameInput(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') clearNameFilter()
            }}
            className='block w-full rounded-md border py-2 pl-10 pr-9 shadow-sm sm:text-sm focus:outline-none border-gray-300 focus:border-blue-300 focus:ring-blue-300 [&::-webkit-search-cancel-button]:hidden'
          />
          {nameInput !== '' && (
            <button
              type='button'
              onClick={clearNameFilter}
              className='absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600'
            >
              <span className='sr-only'>Clear job name filter</span>
              <XMarkIcon aria-hidden='true' className='h-4 w-4' />
            </button>
          )}
        </div>
        <label className='inline-flex items-center cursor-pointer'>
          <input
            type='checkbox'
            checked={allUsers}
            value=''
            className='sr-only peer'
            onChange={onChangeHandler}
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
          <span className='ms-3 text-sm font-medium text-gray-900 dark:text-gray-300'>
            All users
          </span>
        </label>
      </div>
      <JobsTable
        jobs={currentJobs ?? []}
        systemName={selectedSystem?.name || ''}
        emptyMessage={emptyMessage}
      />
    </>
  )
}

export default SystemJobList
