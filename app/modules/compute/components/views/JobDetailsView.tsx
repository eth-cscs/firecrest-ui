/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from '@remix-run/react'
import { ArrowPathIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
// types
import { System } from '~/types/api-status'
import { GetOpsTailResponse } from '~/types/api-filesystem'
import { GetJobResponse, Job, JobMetadata, JobStateStatus } from '~/types/api-job'
// helpers
import { formatTime } from '~/helpers/time-helper'
import { formatDateTimeFromTimestamp } from '~/helpers/date-helper'
// views
import SimpleView, { SimpleViewSize } from '~/components/views/SimpleView'
// panels
import SimplePanel from '~/components/panels/SimplePanel'
// alerts
import AlertError from '~/components/alerts/AlertError'
// tabs
import { UnderlineTabPanel, UnderlineTabs } from '~/components/tabs/UnderlineTabs'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
import JobStateBadge from '~/modules/compute/components/badges/JobStateBadge'
// dialogs
import JobCancelDialog from '~/modules/compute/components/dialogs/JobCancelDialog'
// apis
import { getLocalOpsTail } from '~/apis/filesystem-api'
// cards
import LeftTitleCard from '~/components/cards/LeftTitleCard'
// lists
import { AttributesList, AttributesListItem } from '~/components/lists/AttributesList'
import { getLocalJob } from '~/apis/compute-api'
import { jobCanBeCanceled } from '../../helpers/status-helper'

/**
 * GrafanaIframeRange
 *
 * A self-contained React component to embed a Grafana panel in an <iframe>
 * with interactive controls for time range (from/to) and quick presets.
 *
 * - Uses native <input type="datetime-local"> to avoid extra deps
 * - Rebuilds the iframe src when you click "Apply" (key={src} forces reload)
 * - Provides quick ranges (Last 5m, 15m, 1h, 6h, 24h)
 * - TailwindCSS classes for a clean look (optional)
 *
 * Props
 *  - baseUrl: string (Required) Grafana d-solo URL **without** query string
 *             e.g. "https://firecrest.grafana.tds.cscs.ch/d-solo/job-fake-telemetry/firecrest-e28094-job-fake-telemetry"
 *  - panelId?: number (default 2)
 *  - orgId?: string | number (default 1)
 *  - refresh?: string (default "5s") — passed through to Grafana
 *  - width?: number | string (default "100%") — iframe width
 *  - height?: number | string (default 600) — iframe height
 *  - initialMinutes?: number (default 5) — initial range (now - X minutes → now)
 */
function GrafanaIframeRange({
  baseUrl,
  jobId,
  panelId = 2,
  orgId = 1,
  refresh = '5s',
  width = '100%',
  height = 600,
  initialMinutes = 5,
}: {
  baseUrl: string
  jobId: string | number
  panelId?: number
  orgId?: string | number
  refresh?: string
  width?: number | string
  height?: number | string
  initialMinutes?: number
}) {
  const now = useMemo(() => new Date(), [])
  const [from, setFrom] = useState<Date>(new Date(now.getTime() - initialMinutes * 60 * 1000))
  const [to, setTo] = useState<Date>(now)
  const [error, setError] = useState<string | null>(null)
  const [appliedSrc, setAppliedSrc] = useState<string>(() =>
    buildSrc({
      baseUrl,
      jobId,
      orgId,
      panelId,
      refresh,
      fromMs: now.getTime() - initialMinutes * 60 * 1000,
      toMs: now.getTime(),
    }),
  )

  function handleQuick(minutes: number) {
    const t = new Date()
    const f = new Date(t.getTime() - minutes * 60 * 1000)
    setFrom(f)
    setTo(t)
    setError(null)
  }

  function handleApply() {
    if (!from || !to) return
    if (from.getTime() >= to.getTime()) {
      setError("'From' must be earlier than 'To'.")
      return
    }
    setError(null)
    const src = buildSrc({
      baseUrl,
      jobId,
      orgId,
      panelId,
      refresh,
      fromMs: from.getTime(),
      toMs: to.getTime(),
    })
    setAppliedSrc(src)
  }

  const key = appliedSrc // changing key forces iframe remount (hard reload)

  return (
    <div className='w-full space-y-4'>
      {/* Controls */}
      <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <label className='flex flex-col text-sm'>
            <span className='mb-1 font-medium'>From</span>
            <input
              type='datetime-local'
              className='rounded-xl border px-3 py-2 shadow-sm focus:outline-none focus:ring-2'
              value={dateToLocalInput(from)}
              onChange={(e) => setFrom(localInputToDate(e.target.value))}
            />
          </label>
          <label className='flex flex-col text-sm'>
            <span className='mb-1 font-medium'>To</span>
            <input
              type='datetime-local'
              className='rounded-xl border px-3 py-2 shadow-sm focus:outline-none focus:ring-2'
              value={dateToLocalInput(to)}
              onChange={(e) => setTo(localInputToDate(e.target.value))}
            />
          </label>
        </div>

        <div className='flex flex-wrap gap-2'>
          <QuickButton onClick={() => handleQuick(5)}>Last 5m</QuickButton>
          <QuickButton onClick={() => handleQuick(15)}>Last 15m</QuickButton>
          <QuickButton onClick={() => handleQuick(60)}>Last 1h</QuickButton>
          <QuickButton onClick={() => handleQuick(360)}>Last 6h</QuickButton>
          <QuickButton onClick={() => handleQuick(1440)}>Last 24h</QuickButton>
          <button
            className='rounded-xl px-4 py-2 font-medium shadow-sm border hover:shadow transition'
            onClick={handleApply}
            title='Reload the iframe with the selected time range'
          >
            Apply
          </button>
        </div>
      </div>

      {error && <div className='text-sm text-red-600'>{error}</div>}

      {/* Iframe */}
      <div className='rounded-2xl overflow-hidden border'>
        <iframe
          title={`Grafana panel ${panelId}`}
          key={key}
          src={appliedSrc}
          width={typeof width === 'number' ? String(width) : width}
          height={typeof height === 'number' ? String(height) : height}
          style={{ border: 0, width: typeof width === 'number' ? `${width}px` : width }}
        />
      </div>
    </div>
  )
}

interface JobObserbabilityProps {
  currentJob: Job
  dashboard: string | null
}

const JobObservabilityPanel: React.FC<JobObserbabilityProps> = ({
  currentJob,
  dashboard,
}: JobObserbabilityProps) => {
  if (typeof dashboard !== 'string' || dashboard.trim() === '') return null

  return (
    <SimplePanel title='Job observability' className='mb-4'>
      <UnderlineTabPanel label='Observability'>
        <GrafanaIframeRange
          baseUrl={dashboard}
          jobId={currentJob.jobId}
          panelId={2}
          orgId={1}
          refresh='5s'
          width='100%'
          height={600}
          initialMinutes={5}
        />
      </UnderlineTabPanel>
    </SimplePanel>
  )
}

function QuickButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className='rounded-xl bg-gray-50 px-3 py-2 text-sm font-medium border hover:bg-gray-100 shadow-sm'
      onClick={onClick}
      type='button'
    >
      {children}
    </button>
  )
}

function buildSrc({
  baseUrl,
  jobId,
  orgId,
  panelId,
  refresh,
  fromMs,
  toMs,
}: {
  baseUrl: string
  jobId: string | number
  orgId: string | number
  panelId: number
  refresh: string
  fromMs: number
  toMs: number
}) {
  const qs = new URLSearchParams({
    orgId: String(orgId),
    jobId: String(jobId),
    from: String(fromMs), // Grafana expects epoch ms
    to: String(toMs),
    timezone: 'browser',
    refresh,
    panelId: String(panelId),
  })
  // Explicit solo scene flag used in your sample URL
  qs.append('__feature.dashboardSceneSolo', 'true')
  const fullPath = `${baseUrl}?${qs.toString()}`
  console.log('Grafana iframe src:', fullPath)
  return fullPath
}

/** Convert a Date to a value acceptable by <input type="datetime-local"> */
function dateToLocalInput(d: Date): string {
  // toISOString gives Z (UTC). datetime-local expects local without timezone.
  // Build manually using local parts and zero-pad.
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const MM = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
}

/** Parse the <input type="datetime-local"> string (local time) back to a Date */
function localInputToDate(v: string): Date {
  // v like "2025-09-01T17:00"
  const [datePart, timePart] = v.split('T')
  const [y, m, d] = datePart.split('-').map((n) => parseInt(n, 10))
  const [hh, mm] = timePart.split(':').map((n) => parseInt(n, 10))
  return new Date(y, m - 1, d, hh, mm, 0, 0) // local time
}

interface JobDetailsViewProps {
  jobs: Job[]
  jobsMetadata: JobMetadata[]
  system: System
  error: any
  dashboard: string | null
}

interface ConsoleOutputProps {
  output: string
}

const ConsoleOutput: React.FC<ConsoleOutputProps> = ({ output }: ConsoleOutputProps) => {
  const divRef = useRef(null)

  useEffect(() => {
    const div = divRef.current
    if (div) {
      // Scorri fino al fondo del div
      div.scrollTop = div.scrollHeight
    }
  }, [output])

  return (
    <div
      ref={divRef}
      className='bg-black text-xs text-white p-4 rounded-lg font-mono whitespace-pre-wrap overflow-auto h-80'
    >
      <pre className='m-0'>{output}</pre>
    </div>
  )
}

const JobDetailsView: React.FC<JobDetailsViewProps> = ({
  jobs,
  jobsMetadata,
  system,
  error,
  dashboard,
}: JobDetailsViewProps) => {
  const job = useMemo<Job | null>(() => (jobs && jobs.length > 0 ? jobs[0] : null), [jobs])
  const jobMetadata = useMemo<JobMetadata | null>(
    () => (jobsMetadata && jobsMetadata.length > 0 ? jobsMetadata[0] : null),
    [jobsMetadata],
  )
  const [currentJob, setCurrentJob] = useState<Job | null>(() => job)
  const [syncStandardOut, setSyncStandardOut] = useState<boolean>(true)
  const [jobStandardOuput, setJobStandardOuput] = useState<GetOpsTailResponse | null>(null)
  const [syncStandardError, setSyncStandardError] = useState<boolean>(true)
  const [jobStandardError, setJobStandardError] = useState<GetOpsTailResponse | null>(null)
  const [localError, setLocalError] = useState<any>(error)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const navigate = useNavigate()

  const fetchJob = async (jobId: number, setter: React.Dispatch<React.SetStateAction<Job>>) => {
    try {
      const response: GetJobResponse = await getLocalJob(system.name, jobId)
      const [job] = response.jobs
      setter(job)
    } catch (error) {
      setLocalError(error)
    }
  }

  const fetchJobFileContent = async (
    filePath: string,
    setter: React.Dispatch<React.SetStateAction<GetOpsTailResponse | null>>,
  ) => {
    try {
      const response: GetOpsTailResponse = await getLocalOpsTail(system.name, filePath, '100')
      setter(response)
    } catch (error) {
      setLocalError(error)
    }
  }

  const fetchJobStandardFileContent = (jobMetadata: JobMetadata) => {
    if (
      // syncStandardOut &&
      jobMetadata.standardOutput !== null &&
      jobMetadata.standardOutput !== ''
    ) {
      fetchJobFileContent(jobMetadata.standardOutput, setJobStandardOuput)
    }
    if (
      // syncStandardError &&
      jobMetadata.standardError !== null &&
      jobMetadata.standardError !== ''
    ) {
      fetchJobFileContent(jobMetadata.standardError, setJobStandardError)
    }
  }

  useEffect(() => {
    setCurrentJob(job ?? null)
    if (currentJob !== null) {
      const currentJobStateStatus = currentJob.status.state
      const fecthJobAndJobStandardFileContent = (jobStateStatus: JobStateStatus) => {
        fetchJob(currentJob.jobId, setCurrentJob)
        if (jobMetadata && jobMetadata !== null) {
          // Get job standard output/s
          if (![JobStateStatus.PENDING].includes(jobStateStatus)) {
            fetchJobStandardFileContent(jobMetadata)
          }
        }
      }
      fecthJobAndJobStandardFileContent(currentJobStateStatus)
      if (![JobStateStatus.COMPLETED, JobStateStatus.FAILED].includes(currentJobStateStatus)) {
        const intervalId = setInterval(
          () => fecthJobAndJobStandardFileContent(currentJobStateStatus),
          2000,
        )
        return () => clearInterval(intervalId)
      }
    }
  }, [job])

  useEffect(() => {
    setLocalError(error ?? null)
  }, [error])

  const handleClickReload = () => {
    window.location.reload()
  }

  const handleNavigateBack = () => {
    navigate('/compute')
  }

  const getActionButtons = () => {
    return (
      <div className='flex gap-2'>
        <button
          onClick={handleNavigateBack}
          className='cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
        >
          <ArrowLeftIcon className='-ml-1 mr-2 h-5 w-5 text-gray-500' aria-hidden='true' />
          Back to the job list
        </button>
        <button
          onClick={handleClickReload}
          className='cursor-pointer inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
        >
          <ArrowPathIcon className='-ml-1 mr-2 h-5 w-5 text-green-500' aria-hidden='true' />
          Reload
        </button>
        {currentJob && jobCanBeCanceled(currentJob) && (
          <button
            onClick={() => setCancelDialogOpen(true)}
            className='cursor-pointer inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
          >
            <TrashIcon className='-ml-1 mr-2 h-5 w-5 text-red-500' aria-hidden='true' />
            Cancel
          </button>
        )}
      </div>
    )
  }

  if (!currentJob) {
    return (
      <div className='p-4 text-sm text-gray-600'>
        {localError ? 'Failed to load job.' : 'Loading job details…'}
      </div>
    )
  }

  return (
    <SimpleView size={SimpleViewSize.FULL} className='mb-4'>
      <SimplePanel title='Job details' className='mb-4' actionsButtons={getActionButtons()}>
        <>
          <AlertError error={localError} />
          <JobCancelDialog
            job={currentJob}
            system={system}
            open={cancelDialogOpen}
            onClose={() => setCancelDialogOpen(false)}
          />
          <LeftTitleCard
            title='Job identification data'
            subtitle='This section contains information that identifies the job, including its unique ID, name, user, and status'
            className='mb-8 border-b border-gray-900/10'
          >
            <AttributesList>
              <AttributesListItem label='Job ID'>#{currentJob.jobId}</AttributesListItem>
              <AttributesListItem label='Name'>{currentJob.name}</AttributesListItem>
              <AttributesListItem label='Status'>
                <JobStateBadge status={currentJob.status} />
              </AttributesListItem>
              <AttributesListItem label='Submitted by'>
                <LabelBadge color={LabelColor.BLUE}>{currentJob.user}</LabelBadge>
              </AttributesListItem>
              <AttributesListItem label='Account'>
                {currentJob?.account !== '' ? (
                  <LabelBadge color={LabelColor.BLUE}>{currentJob.account}</LabelBadge>
                ) : (
                  <LabelBadge color={LabelColor.GRAY}>undefined</LabelBadge>
                )}{' '}
              </AttributesListItem>
            </AttributesList>
          </LeftTitleCard>
          <LeftTitleCard
            title='Execution times'
            subtitle='This section provides the time-related details of the job execution, including start and end times, and the total execution duration'
            className='mb-8 border-b border-gray-900/10'
          >
            <AttributesList>
              <AttributesListItem label='Start time'>
                {formatDateTimeFromTimestamp({ timestamp: currentJob.time.start })}
              </AttributesListItem>
              <AttributesListItem label='End time'>
                {formatDateTimeFromTimestamp({ timestamp: currentJob.time.end })}
              </AttributesListItem>
              <AttributesListItem label='Execution time'>
                {formatTime({ time: currentJob.time.elapsed })}
              </AttributesListItem>
            </AttributesList>
          </LeftTitleCard>
          <LeftTitleCard
            title='System and resource details'
            subtitle='This section covers the system and resources allocated to the job, including the system name, cluster, nodes, and working environment'
          >
            <AttributesList>
              <AttributesListItem label='System name'>
                <LabelBadge color={LabelColor.YELLOW}>{system.name}</LabelBadge>
              </AttributesListItem>
              <AttributesListItem label='Cluster'>
                <LabelBadge color={LabelColor.YELLOW}>{currentJob.cluster}</LabelBadge>
              </AttributesListItem>
              <AttributesListItem label='Nodes'>{currentJob.nodes}</AttributesListItem>
              <AttributesListItem label='Partition'>{currentJob.partition}</AttributesListItem>
              <AttributesListItem label='Working directory'>
                {currentJob.workingDirectory}
              </AttributesListItem>
            </AttributesList>
          </LeftTitleCard>
          {jobMetadata !== undefined && jobMetadata !== null && (
            <div className='border-t border-gray-900/10 mt-5 pt-5'>
              <UnderlineTabs>
                <UnderlineTabPanel label='Script'>
                  <ConsoleOutput output={jobMetadata.script || ''} />
                </UnderlineTabPanel>
                <UnderlineTabPanel label='Standard input'>
                  <ConsoleOutput output={jobMetadata.standardInput || ''} />
                </UnderlineTabPanel>
                {jobMetadata.standardOutput !== jobMetadata.standardError ? (
                  <>
                    <UnderlineTabPanel label='Standard output'>
                      <ConsoleOutput output={jobStandardOuput?.output?.content || '...'} />
                    </UnderlineTabPanel>
                    <UnderlineTabPanel label='Standard error'>
                      <ConsoleOutput output={jobStandardError?.output?.content || '...'} />
                    </UnderlineTabPanel>
                  </>
                ) : (
                  <UnderlineTabPanel label='Standard output'>
                    <ConsoleOutput output={jobStandardOuput?.output?.content || '...'} />
                  </UnderlineTabPanel>
                )}
              </UnderlineTabs>
            </div>
          )}
        </>
      </SimplePanel>
      <JobObservabilityPanel dashboard={dashboard} currentJob={currentJob} />
    </SimpleView>
  )
}

export default JobDetailsView
