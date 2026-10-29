/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router'
import { StatusCodes } from 'http-status-codes'
import {
  CalendarIcon,
  ClockIcon,
  XMarkIcon,
  CommandLineIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  InformationCircleIcon,
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

const JobTableRow: React.FC<JobTableRowProps> = ({ system, job, account }: JobTableRowProps) => {
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

interface JobsTableProps {
  jobs: Job[]
  systemName: string
  emptyMessage?: string
}

const JobsTable: React.FC<JobsTableProps> = ({ jobs, systemName, emptyMessage }) => {
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
            <JobTableRow system={systemName} key={`${job.jobId}`} job={job} account={job.account} />
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
  // Keep the existing history state: React Router stores its own entry key/index there.
  window.history.replaceState(window.history.state, '', url.toString())
}

const SystemJobList: React.FC<SystemJobListProps> = ({ initialAllUsers, initialName }) => {
  const [allUsers, setAllUsers] = useState<boolean>(initialAllUsers)
  // What's typed in the search box vs. the (debounced, normalized) value actually sent to the API.
  const [nameInput, setNameInput] = useState<string>(initialName)
  const [name, setName] = useState<string>(initialName)
  // Open on first render when the URL already carries a filter, so it's never applied unseen.
  const [filtersOpen, setFiltersOpen] = useState<boolean>(initialName !== '')
  // Taken from the route, not the System/Group contexts: on the first render those fall back to
  // the first system/group until an effect applies the URL's, which made the list fetch (and
  // sometimes display) jobs from the wrong system right after a page load.
  const { systemName, accountName } = useParams()
  const { setRefreshing } = useRefreshing()
  const { setMaintenance } = useMaintenance()
  // Last response received, plus whether a request is in flight and the last poll's failure.
  // A plain fetch (not useFetcher) on purpose: a failed fetcher load is handed to the route's
  // ErrorBoundary, which replaced the whole page with "Failed to fetch" after a single network
  // blip (laptop sleep, VPN/network change, pod restart) and stopped polling for good. Here a
  // failure keeps the last list on screen, shows an inline error and the next poll retries.
  const [jobsData, setJobsData] = useState<GetSystemJobsResponse | MaintenancePayload | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [pollError, setPollError] = useState<string | null>(null)

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

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.currentTarget.checked
    setAllUsers(checked)
    replaceUrlSearchParam('allUsers', String(checked))
    // The effect below re-fetches on the `allUsers` change - no need to trigger it here too.
  }

  // Keep the URL in line with what the list shows, so a copied/shared link opens the same list
  // instead of depending on the recipient's own remembered cookie. Needed on first load (the
  // toggle may come from the cookie, not the URL) and after switching system/account, which
  // navigates to a bare path without remounting this component.
  const { pathname } = useLocation()
  useEffect(() => {
    replaceUrlSearchParam('allUsers', String(allUsers))
    replaceUrlSearchParam('name', name || null)
  }, [pathname])

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

  // Initial load, plus a self-pacing poll: skips a tick while the previous request is still in
  // flight instead of firing every JOBS_POLL_INTERVAL_MS regardless, so a slow backend gets to
  // finish a request rather than having it superseded every time the interval fires. When the
  // query changes (or the list unmounts) the in-flight request is aborted and its result ignored,
  // so an old response can never land after, and clobber, a newer one.
  useEffect(() => {
    if (!systemName || !accountName) return
    const url = buildUrl(systemName, accountName, allUsers, name)
    let controller: AbortController | null = null
    let cancelled = false

    const load = async () => {
      if (controller) return
      const currentController = new AbortController()
      controller = currentController
      setLoading(true)
      try {
        const response = await fetch(url, {
          signal: currentController.signal,
          headers: { Accept: 'application/json' },
          // Don't follow redirects (e.g. to the IdP when the session can't be refreshed): a
          // cross-origin redirect can't be read here anyway.
          redirect: 'manual',
        })
        if (cancelled) return
        if (response.type === 'opaqueredirect' || response.status === StatusCodes.UNAUTHORIZED) {
          // Session expired: reload so the page loader runs the normal login flow.
          window.location.reload()
          return
        }
        if (!response.ok) {
          throw new Error(`the server responded with ${response.status}`)
        }
        const result = (await response.json()) as GetSystemJobsResponse | MaintenancePayload
        if (cancelled) return
        setJobsData(result)
        setPollError(null)
      } catch (error) {
        if (cancelled) return
        setPollError(
          `Unable to refresh the job list (${
            error instanceof Error ? error.message : 'unknown error'
          }). Retrying automatically...`,
        )
      } finally {
        controller = null
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const intervalId = setInterval(load, JOBS_POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(intervalId)
      controller?.abort()
    }
  }, [systemName, accountName, allUsers, name])

  useEffect(() => {
    setRefreshing(loading, 'Refreshing jobs...')
  }, [loading])

  // Don't leave the footer stuck on "Refreshing jobs..." if the list goes away mid-request.
  useEffect(() => () => setRefreshing(false), [])

  useEffect(() => {
    if (isMaintenancePayload(jobsData)) {
      setMaintenance(true, getMaintenancePayloadMessage(jobsData))
    }
  }, [jobsData])

  if (!jobsData) {
    return pollError ? (
      <AlertError error={{ message: pollError }} />
    ) : (
      <LoadingSpinner title='Loading jobs...' className='py-10' />
    )
  }

  if (isMaintenancePayload(jobsData)) {
    // AppLayout swaps to the maintenance page on the next render once setMaintenance() above
    // takes effect - nothing meaningful to render here in the meantime.
    return null
  }

  // Never show a response for a different query than the one currently selected (e.g. one that
  // was still in flight when the system, account, toggle or filter changed) - wait for the
  // matching one instead of briefly, or permanently, showing the wrong list. The controls stay
  // rendered meanwhile, so the search field keeps focus while a new filter loads.
  const isCurrentQuery =
    jobsData.system === systemName &&
    jobsData.account === accountName &&
    (jobsData.allUsers ?? false) === allUsers &&
    (jobsData.name ?? '') === name
  const currentJobs = sortJobs(jobsData?.jobs ?? [])
  const localError = jobsData?.error ?? null
  const emptyMessage = jobsData?.name
    ? `No jobs named "${jobsData.name}" found. The search matches the full job name exactly.`
    : undefined
  // Counts applied filters (not what's still being typed), shown on the toggle when collapsed.
  const activeFilterCount = name ? 1 : 0

  return (
    <>
      {pollError && <AlertError error={{ message: pollError }} />}
      {isCurrentQuery && !pollError && <AlertError error={localError} />}
      <div className='pt-2 pb-4 flex flex-row items-center justify-between gap-4'>
        <button
          type='button'
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls='job-filters'
          className='inline-flex items-center gap-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900'
        >
          <FunnelIcon aria-hidden='true' className='h-5 w-5 text-gray-400' />
          Advanced search
          {activeFilterCount > 0 && (
            <span className='rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-700'>
              {activeFilterCount}
            </span>
          )}
          <ChevronDownIcon
            aria-hidden='true'
            className={`h-4 w-4 text-gray-400 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <div className='inline-flex items-center gap-1'>
          {/* Outside the label, so clicking the icon doesn't flip the toggle. */}
          <SimpleTooltip
            id='all-users-remembered-hint'
            message='When on, shows the jobs submitted by all users within the selected project, not only yours. Your choice is remembered in this browser and used the next time you open the job list.'
            className='right-0 top-7 w-64 whitespace-normal'
          >
            <button
              type='button'
              aria-describedby='all-users-remembered-hint'
              className='rounded-full p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300'
            >
              <span className='sr-only'>About the All users setting</span>
              <InformationCircleIcon aria-hidden='true' className='h-5 w-5' />
            </button>
          </SimpleTooltip>
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
      </div>
      {filtersOpen && (
        <div id='job-filters' className='mb-4 rounded-md border border-gray-200 bg-gray-50 p-4'>
          {/* Server-side filters: changing them reloads the list from the scheduler. Future
              local (in-browser) filters should be labelled differently so the two aren't confused.
              One label + field row per filter (like the job details view), with a fixed-width
              label column so the field sits close and future rows (e.g. a date range) line up. */}
          <div className='divide-y divide-gray-200'>
            <div className='py-2 sm:grid sm:grid-cols-[8rem_minmax(0,28rem)] sm:items-center sm:gap-4'>
              <label htmlFor='job-name-filter' className='block text-sm font-medium text-gray-900'>
                Job name
              </label>
              <div className='relative mt-1 w-full sm:mt-0'>
                <MagnifyingGlassIcon
                  aria-hidden='true'
                  className='pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400'
                />
                <input
                  id='job-name-filter'
                  type='search'
                  value={nameInput}
                  maxLength={JOB_NAME_FILTER_MAX_LENGTH}
                  placeholder='Load jobs by exact name'
                  title='Asks the scheduler only for jobs whose name matches exactly'
                  onChange={(event) => setNameInput(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') clearNameFilter()
                  }}
                  className='block w-full rounded-md border bg-white py-2 pl-10 pr-9 shadow-sm sm:text-sm focus:outline-none border-gray-300 focus:border-blue-300 focus:ring-blue-300 [&::-webkit-search-cancel-button]:hidden'
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
            </div>
          </div>
        </div>
      )}
      {isCurrentQuery ? (
        <JobsTable
          jobs={currentJobs ?? []}
          systemName={systemName ?? ''}
          emptyMessage={emptyMessage}
        />
      ) : (
        <LoadingSpinner title='Loading jobs...' className='py-10' />
      )}
    </>
  )
}

export default SystemJobList
