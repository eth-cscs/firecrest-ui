/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { Link } from '@remix-run/react'
import React, { useEffect, useRef, useMemo, useState } from 'react'
import { ArrowDownCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
// types
import type { System } from '~/types/api-status'
import { GetOpsTailResponse, GetOpsLsResponse, File } from '~/types/api-filesystem'
import { GetJobResponse, Job, JobMetadata, JobStateStatus } from '~/types/api-job'
// helpers
import { formatTime } from '~/helpers/time-helper'
import { nidStringToArray } from '~/helpers/nid-parser'
import { formatDateTimeFromTimestamp } from '~/helpers/date-helper'
import { jobCanBeCanceled } from '~/modules/compute/helpers/status-helper'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
import JobStateBadge from '~/modules/compute/components/badges/JobStateBadge'
// lists
import { AttributesList, AttributesListItem } from '~/components/lists/AttributesList'
// dialogs
import JobCancelDialog from '~/modules/compute/components/dialogs/JobCancelDialog'
import DownloadDialog from '~/modules/filesystem/components/dialogs/DownloadDialog'
// apis
import { getLocalJob } from '~/apis/compute-api'
import { getLocalOpsTail, getLocalOpsLs } from '~/apis/filesystem-api'
// grafana
import EmbedPanelGrafana from '~/modules/compute/components/grafana/EmbedPanelGrafana'

// contexts
import { useGroup } from '~/contexts/GroupContext'

interface JobDetailsPanelProps {
  job?: Job
  jobMetadata?: JobMetadata
  system?: System
  stdoutFile?: File
  stderrFile?: File
}

const JobDetailsPanel: React.FC<JobDetailsPanelProps> = ({
  job,
  jobMetadata,
  system,
  stdoutFile,
  stderrFile,
}) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [stdoutDownloadDialogOpen, setStdoutDownloadDialogOpen] = useState(false)
  const [stderrDownloadDialogOpen, setStderrDownloadDialogOpen] = useState(false)
  const { selectedGroup } = useGroup()

  const handleStdoutDownload = () => {
    setStdoutDownloadDialogOpen(true)
  }
  const handleStderrDownload = () => {
    setStdoutDownloadDialogOpen(true)
  }

  return (
    <>
      <JobCancelDialog
        job={job!}
        system={system?.name!}
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      />
      {job && jobCanBeCanceled(job) && (
        <div className='mt-2 mb-4 flex justify-end gap-2"'>
          <button
            className='flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
            onClick={() => setCancelDialogOpen(true)}
          >
            <XMarkIcon className='w-4 h-4' />
            Cancel job
          </button>
        </div>
      )}

      <h3 className='font-semibold mb-3'>Job details</h3>
      <AttributesList>
        <AttributesListItem label='Job ID'>#{job?.jobId}</AttributesListItem>
        <AttributesListItem label='Name'>{job?.name}</AttributesListItem>
        <AttributesListItem label='Status'>
          {job?.status && <JobStateBadge status={job?.status} />}
        </AttributesListItem>
        <AttributesListItem label='Submitted by'>
          <LabelBadge color={LabelColor.BLUE}>{job?.user}</LabelBadge>
        </AttributesListItem>
        <AttributesListItem label='Account'>
          {job?.account !== '' ? (
            <LabelBadge color={LabelColor.BLUE}>{job?.account}</LabelBadge>
          ) : (
            <LabelBadge color={LabelColor.GRAY}>undefined</LabelBadge>
          )}
        </AttributesListItem>
      </AttributesList>

      <h3 className='font-semibold mb-3 mt-9'>Execution times</h3>
      <AttributesList>
        <AttributesListItem label='Start time'>
          {formatDateTimeFromTimestamp({ timestamp: job?.time.start })}
        </AttributesListItem>
        <AttributesListItem label='Start time'>
          {formatDateTimeFromTimestamp({ timestamp: job?.time.end })}
        </AttributesListItem>
        <AttributesListItem label='Execution time'>
          {formatTime({ time: job?.time.elapsed })}
        </AttributesListItem>
      </AttributesList>

      <h3 className='font-semibold mb-3 mt-9'>Files</h3>
      <AttributesList>
        <AttributesListItem label='StdOut'>
          <div className='flex flex-col gap-2 min-w-0'>
            <div className='flex-1 min-w-0 break-words'>{jobMetadata?.standardOutput || 'N/A'}</div>

            {stdoutFile && (
              <>
                <DownloadDialog
                  system={system?.name || ''}
                  file={stdoutFile}
                  accountName={selectedGroup?.name || ''}
                  open={stdoutDownloadDialogOpen}
                  onClose={() => setStdoutDownloadDialogOpen(false)}
                />
                <button
                  onClick={handleStdoutDownload}
                  title='Download STDOUT log'
                  className='w-8 h-8 flex items-center justify-center rounded-md border text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100'
                >
                  <ArrowDownCircleIcon className='w-4 h-4' />
                </button>
              </>
            )}
          </div>
        </AttributesListItem>
        <AttributesListItem label='StdErr'>
          <div className='flex flex-col gap-2 min-w-0'>
            <div className='flex-1 min-w-0 break-words'>{jobMetadata?.standardError || 'N/A'}</div>
            {stderrFile && (
              <>
                <DownloadDialog
                  system={system?.name || ''}
                  file={stderrFile}
                  open={stderrDownloadDialogOpen}
                  accountName={selectedGroup?.name || ''}
                  onClose={() => setStderrDownloadDialogOpen(false)}
                />
                <button
                  onClick={handleStderrDownload}
                  title='Download STDOUT log'
                  className='w-8 h-8 flex items-center justify-center rounded-md border text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100'
                >
                  <ArrowDownCircleIcon className='w-4 h-4' />
                </button>
              </>
            )}
          </div>
        </AttributesListItem>
        <AttributesListItem label='StdIn'>{jobMetadata?.standardInput || 'N/A'}</AttributesListItem>
        <AttributesListItem label='Working directory'>
          {job?.workingDirectory || 'N/A'}
        </AttributesListItem>
      </AttributesList>

      <h3 className='font-semibold mb-3 mt-9'>System and resource details</h3>
      <AttributesList>
        <AttributesListItem label='System name'>
          <LabelBadge color={LabelColor.YELLOW}>{system?.name}</LabelBadge>
        </AttributesListItem>
        <AttributesListItem label='Cluster'>
          <LabelBadge color={LabelColor.YELLOW}>{job?.cluster}</LabelBadge>
        </AttributesListItem>
        <AttributesListItem label='Nodes'>{job?.nodes}</AttributesListItem>
        <AttributesListItem label='Partition'>{job?.partition}</AttributesListItem>
      </AttributesList>
    </>
  )
}

interface JobDetailCenterProps {
  job?: Job
  jobMetadata?: JobMetadata
  system?: System
  activeTab: OutputTabId
  stdout?: string
  stdoutFile?: File
  stdin?: string
  stderr?: string
  stderrFile?: File
  script?: string
  dashboards?: GrafanaDashboard[]
  onChangeTab: (id: OutputTabId) => void
}

const JobDetailCenter: React.FC<JobDetailCenterProps> = ({
  job,
  jobMetadata,
  system,
  activeTab,
  stdout,
  stdoutFile,
  stdin,
  stderr,
  stderrFile,
  script,
  dashboards,
  onChangeTab,
}) => {
  if (!dashboards || dashboards.length === 0) {
    OUTPUT_TABS.find((t) => t.id === 'resources')!.enabled = false
  }
  return (
    <div
      className='flex-1 rounded-xl border bg-white shadow-sm m-6 pt-2'
      style={{ marginTop: '20px' }}
    >
      <div className='sticky top-16 flex items-center justify-between bg-white p-4 px-3 py-2 shrink-0 z-9 '>
        <select
          name='datasource'
          value={activeTab}
          onChange={(e) => onChangeTab(e.target.value)}
          className='flex-none w-64 border-gray-300 focus:border-blue-300 focus:ring-blue-300 rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none'
        >
          <option value='stdout'>Job StdOut</option>
          <option value='stderr'>Job StdErr</option>
          <option value='stdin'>Job StdIn</option>
          <option value='script'>Job Script</option>
          {dashboards && dashboards.length > 0 && <option value='resources'>Dashboards</option>}
        </select>
      </div>
      <div className='min-w-0 h-full min-h-0 pt-4 '>
        {activeTab === 'stdout' && <ConsolePane content={stdout} />}
        {activeTab === 'stdin' && <ConsolePane content={stdin} />}
        {activeTab === 'stderr' && <ConsolePane content={stderr} />}
        {activeTab === 'script' && <ConsolePane content={script} />}
        {activeTab === 'resources' && dashboards && dashboards.length > 0 && (
          <ResourcesPaneMulti job={job!} dashboards={dashboards} title='Resources' />
        )}
      </div>
      <aside className='fixed right-0 top-16 bottom-12 w-[30rem] border-l bg-white overflow-y-auto'>
        <div className='p-4'>
          <JobDetailsPanel
            job={job}
            jobMetadata={jobMetadata}
            system={system}
            stdoutFile={stdoutFile}
            stderrFile={stderrFile}
          />
        </div>
      </aside>
    </div>
  )
}

interface ConsolePaneProps {
  content?: string
}

const ConsolePane: React.FC<ConsolePaneProps> = ({ content }) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [content])

  return (
    <section className='h-full min-h-0 flex flex-col'>
      <div className='flex-1 bg-black text-neutral-100 font-mono text-[12px] leading-5'>
        <pre className='px-3 py-2 whitespace-pre-wrap'>{content || '# No data available'}</pre>
      </div>
    </section>
  )
}

interface ResourcePaneProps {
  src?: string
  title?: string
}

const ResourcePane: React.FC<ResourcePaneProps> = ({ src, title }) => {
  return (
    <section className='h-full min-h-0 flex flex-col'>
      <div className='flex items-center justify-between border-b bg-white px-3 py-2 shrink-0'>
        <div className='text-sm font-medium'>{title || 'Resources'}</div>
      </div>
      <div className='flex-1 bg-white'>
        {src ? (
          <iframe
            src={src}
            className='w-full h-full min-h-[600px] border-0'
            title={title || 'Resources dashboard'}
            loading='lazy'
            referrerPolicy='no-referrer'
          />
        ) : (
          <div className='p-6 text-sm text-neutral-500'>No resource URL configured.</div>
        )}
      </div>
    </section>
  )
}

type GrafanaDashboard = { id: string; label: string; src: string }

interface ResourceGrafanaPaneProps {
  job: Job
  dashboard: GrafanaDashboard
}

const ResourceGrafanaPane: React.FC<ResourceGrafanaPaneProps> = ({ job, dashboard }) => {
  const startMs = job.time.start ? job.time.start * 1000 : Date.now() - 5 * 60 * 1000
  const endMs = job.time.end ? job.time.end * 1000 : Date.now()
  const nodes = nidStringToArray(job.nodes || '')
  const cluster = job.cluster || 'unknown'
  return (
    <div className='p-4'>
      <EmbedPanelGrafana
        baseUrl={dashboard.src}
        jobId={job.jobId}
        nodes={nodes}
        cluster={cluster}
        jobStartMs={startMs}
        jobEndMs={endMs}
        panelId={2}
        orgId={1}
        refresh='5s'
        width='100%'
        height={600}
        initialMinutes={5}
      />
    </div>
  )
}

interface ResourcesPaneMultiProps {
  job: Job
  dashboards: GrafanaDashboard[]
  title?: string
}

const ResourcesPaneMulti: React.FC<ResourcesPaneMultiProps> = ({ job, dashboards, title }) => {
  const [activeId, setActiveId] = React.useState<string>(dashboards?.[0]?.id ?? '')
  const [showAll, setShowAll] = React.useState(dashboards.length > 1)
  const active = React.useMemo(
    () => dashboards.find((d) => d.id === activeId) ?? dashboards[0],
    [dashboards, activeId],
  )
  return (
    <section className='h-full min-h-0 flex flex-col'>
      <div className='flex items-center justify-between border-b bg-white px-3 py-2 shrink-0'>
        <div className='flex items-center gap-2'>
          <div className='text-sm font-medium'>{title || 'Resources'}</div>
          <div className='hidden md:flex items-center gap-1 ml-3'>
            {dashboards.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setShowAll(false)
                  setActiveId(d.id)
                }}
                data-active={showAll || active?.id === d.id}
                className='text-xs rounded-md border px-2 py-1 bg-white hover:bg-neutral-50 data-[active=true]:bg-neutral-900 data-[active=true]:text-white'
                title={d.label}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {dashboards.length > 1 && (
            <label className='flex items-center gap-1 text-xs text-neutral-600'>
              <input
                type='checkbox'
                className='accent-neutral-800'
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              Show all
            </label>
          )}
          <select
            className='md:hidden text-xs border rounded px-2 py-1 bg-white'
            value={activeId}
            onChange={(e) => {
              setShowAll(false)
              setActiveId(e.target.value)
            }}
          >
            {dashboards.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='flex-1 bg-white'>
        {!dashboards?.length ? (
          <div className='p-6 text-sm text-neutral-500'>No Grafana dashboards configured.</div>
        ) : showAll ? (
          <div className='p-3 grid grid-cols-1 md:grid-cols-2 gap-3'>
            {dashboards.map((d) => (
              <div key={d.id} className='rounded-lg border overflow-hidden'>
                <div className='px-3 py-2 text-xs font-semibold border-b bg-white'>{d.label}</div>
                {/* <iframe
                  src={d.src}
                  className='w-full h-[600px] border-0'
                  title={d.label}
                  loading='lazy'
                  referrerPolicy='no-referrer'
                /> */}
                <ResourceGrafanaPane job={job} dashboard={d} />
              </div>
            ))}
          </div>
        ) : (
          // <iframe
          //   key={active?.id}
          //   src={active?.src}
          //   className='w-full h-full min-h-[600px] border-0'
          //   title={active?.label || 'Grafana dashboard'}
          //   loading='lazy'
          //   referrerPolicy='no-referrer'
          // />
          <ResourceGrafanaPane job={job} dashboard={active} />
        )}
      </div>
    </section>
  )
}

let OUTPUT_TABS = [
  { id: 'stdout', label: 'STD OUT', enabled: true },
  { id: 'stdin', label: 'STD IN', enabled: true },
  { id: 'stderr', label: 'STD ERR', enabled: true },
  { id: 'script', label: 'SCRIPT', enabled: true },
  { id: 'resources', label: 'RESOURCES', enabled: true },
]

type OutputTabId = (typeof OUTPUT_TABS)[number]['id']

interface JobDetailsLayoutProps {
  job?: Job
  jobMetadata?: JobMetadata
  system?: System
  activeTab: OutputTabId
  stdout?: string
  stdoutFile?: File
  stdin?: string
  stderr?: string
  stderrFile?: File
  script?: string
  dashboards?: GrafanaDashboard[]
  onChangeTab: (id: OutputTabId) => void
}

const JobDetailsLayout: React.FC<JobDetailsLayoutProps> = ({
  job,
  jobMetadata,
  system,
  activeTab,
  stdout,
  stdoutFile,
  stdin,
  stderr,
  stderrFile,
  script,
  dashboards,
  onChangeTab,
}) => {
  return (
    <div className='flex flex-1 flex-col gap-4 pb-20'>
      <div className='flex flex-1 h-full'>
        <JobDetailCenter
          job={job}
          jobMetadata={jobMetadata}
          system={system}
          activeTab={activeTab}
          stdout={stdout}
          stdoutFile={stdoutFile}
          stdin={stdin}
          stderr={stderr}
          stderrFile={stderrFile}
          script={script}
          dashboards={dashboards}
          onChangeTab={onChangeTab}
        />
      </div>
    </div>
  )
}

interface JobDetailsConsoleViewProps {
  jobs: Job[]
  jobsMetadata: JobMetadata[]
  system: any
  error: any
  dashboard: any
}

const JobDetailsConsoleView: React.FC<JobDetailsConsoleViewProps> = ({
  jobs,
  jobsMetadata,
  system,
  error,
  dashboard,
}: JobDetailsConsoleViewProps) => {
  const job = useMemo<Job | null>(() => (jobs && jobs.length > 0 ? jobs[0] : null), [jobs])
  const jobMetadata = useMemo<JobMetadata | null>(
    () => (jobsMetadata && jobsMetadata.length > 0 ? jobsMetadata[0] : null),
    [jobsMetadata],
  )
  const [currentJob, setCurrentJob] = useState<Job | null>(() => job)
  const [jobStandardOuput, setJobStandardOuput] = useState<GetOpsTailResponse | null>(null)
  const [jobStandardOutputFile, setJobStandardOutputFile] = useState<File | null>(null)
  const [jobStandardError, setJobStandardError] = useState<GetOpsTailResponse | null>(null)
  const [jobStandardErrorFile, setJobStandardErrorFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState<any>(error)
  const [activeTab, setActiveTab] = React.useState<OutputTabId>('stdout')

  const fetchJob = async (
    jobId: number,
    setter: React.Dispatch<React.SetStateAction<Job | null>>,
  ) => {
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
    if (jobMetadata.standardOutput !== null && jobMetadata.standardOutput !== '') {
      fetchJobFileContent(jobMetadata.standardOutput, setJobStandardOuput)
    }
    if (jobMetadata.standardError !== null && jobMetadata.standardError !== '') {
      fetchJobFileContent(jobMetadata.standardError, setJobStandardError)
    }
  }

  const fecthJobFile = async (
    filePath: string,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
  ) => {
    try {
      const response: GetOpsLsResponse = await getLocalOpsLs(system.name, filePath)
      if (response.output && response.output.length > 0) {
        setter(response.output[0])
      }
    } catch (error) {
      setLocalError(error)
    }
  }

  const fecthJobStandardFile = async (jobMetadata: JobMetadata) => {
    if (jobMetadata.standardOutput !== null && jobMetadata.standardOutput !== '') {
      fecthJobFile(jobMetadata.standardOutput, setJobStandardOutputFile)
    }
    if (jobMetadata.standardError !== null && jobMetadata.standardError !== '') {
      fecthJobFile(jobMetadata.standardError, setJobStandardErrorFile)
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
            fecthJobStandardFile(jobMetadata)
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

  let dashboards: GrafanaDashboard[] = []
  if (dashboard && dashboard !== null && dashboard !== '') {
    dashboards = [
      {
        id: '1',
        label: 'Grafana Dashboard',
        src: dashboard,
      },
    ]
  }

  console.log('JobDetailsConsoleView render', dashboards)

  return (
    // <ActiveScrollCtx.Provider value={ctxValue}>
    <JobDetailsLayout
      job={currentJob || undefined}
      jobMetadata={jobMetadata || undefined}
      system={system}
      activeTab={activeTab}
      stdout={jobStandardOuput?.output?.content}
      stdoutFile={jobStandardOutputFile || undefined}
      stdin={jobMetadata?.standardInput || undefined}
      stderr={jobStandardError?.output?.content}
      stderrFile={jobStandardErrorFile || undefined}
      script={jobMetadata?.script || undefined}
      dashboards={dashboards}
      onChangeTab={setActiveTab}
    />
    // </ActiveScrollCtx.Provider>
  )
}

export default JobDetailsConsoleView
