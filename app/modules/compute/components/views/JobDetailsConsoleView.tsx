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
import { GetOpsTailResponse } from '~/types/api-filesystem'
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
// apis
import { getLocalJob } from '~/apis/compute-api'
import { getLocalOpsTail } from '~/apis/filesystem-api'
// grafana
import EmbedPanelGrafana from '~/modules/compute/components/grafana/EmbedPanelGrafana'

// const ActiveScrollCtx = React.createContext<{ setActive: (el: HTMLElement | null) => void } | null>(
//   null,
// )

interface JobDetailsPanelProps {
  job?: Job
  jobMetadata?: JobMetadata
  system?: System
}

const JobDetailsPanel: React.FC<JobDetailsPanelProps> = ({ job, jobMetadata, system }) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  return (
    <>
      <JobCancelDialog
        job={job!}
        system={system!}
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
      <h3 className='text-sm font-semibold mb-3'>Job details</h3>
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
      <div className='mt-4 mb-6 border-b border-gray-900/10' />
      <h3 className='text-sm font-semibold mb-3'>Execution times</h3>
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
      <div className='mt-4 mb-6 border-b border-gray-900/10' />
      <h3 className='text-sm font-semibold mb-3'>System and resource details</h3>
      <AttributesList>
        <AttributesListItem label='System name'>
          <LabelBadge color={LabelColor.YELLOW}>{system?.name}</LabelBadge>
        </AttributesListItem>
        <AttributesListItem label='Cluster'>
          <LabelBadge color={LabelColor.YELLOW}>{job?.cluster}</LabelBadge>
        </AttributesListItem>
        <AttributesListItem label='Nodes'>{job?.nodes}</AttributesListItem>
        <AttributesListItem label='Partition'>{job?.partition}</AttributesListItem>
        <AttributesListItem label='Working directory'>{job?.workingDirectory}</AttributesListItem>
      </AttributesList>
    </>
  )
}

interface JobDetailCenterProps {
  job?: Job
  jobMetadata?: JobMetadata
  system?: System
  activeTab: OutputTabId
  stdout: string
  stdin: string
  stderr: string
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
  stdin,
  stderr,
  script,
  dashboards,
  onChangeTab,
}) => {
  if (!dashboards || dashboards.length === 0) {
    OUTPUT_TABS.find((t) => t.id === 'resources')!.enabled = false
  }
  return (
    <div className='flex flex-1 rounded-xl border bg-white/70 shadow-sm'>
      <div className='flex-1 min-w-0 h-full min-h-0'>
        {activeTab === 'stdout' && <ConsolePane title='Job output – STDOUT' content={stdout} />}
        {activeTab === 'stdin' && <ConsolePane title='Job input – STDIN' content={stdin} />}
        {activeTab === 'stderr' && <ConsolePane title='Job output – STDERR' content={stderr} />}
        {activeTab === 'script' && <ScriptPane script={script} />}
        {activeTab === 'resources' && dashboards && dashboards.length > 0 && (
          <ResourcesPaneMulti job={job!} dashboards={dashboards} title='Resources' />
        )}
      </div>
      <aside className='fixed right-0 top-16 bottom-12 w-[30rem] border-l bg-white overflow-y-auto'>
        <RightTabs active={activeTab} onChange={onChangeTab} />
        <div className='p-4'>
          <JobDetailsPanel job={job} jobMetadata={jobMetadata} system={system} />
        </div>
      </aside>
    </div>
  )
}

interface ConsolePaneProps {
  title: string
  content: string
}

const ConsolePane: React.FC<ConsolePaneProps> = ({ title, content }) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [content])

  const handleDownload = () => {}

  return (
    <section className='h-full min-h-0 flex flex-col'>
      <div className='flex items-center justify-between border-b bg-white/60 backdrop-blur px-3 py-2 shrink-0'>
        <div className='text-sm font-medium'>{title}</div>
        <div className='flex items-center gap-2 text-xs'>
          {/* <button
            onClick={handleDownload}
            title='Download STDOUT log'
            className='w-8 h-8 flex items-center justify-center rounded-md border text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100'
          >
            <ArrowDownCircleIcon className='w-4 h-4' />
          </button> */}
        </div>
      </div>
      <div className='flex-1 bg-black text-neutral-100 font-mono text-[12px] leading-5'>
        <pre className='px-3 py-2 whitespace-pre-wrap'>{content}</pre>
      </div>
    </section>
  )
}

interface ScriptPaneProps {
  script?: string
}

const ScriptPane: React.FC<ScriptPaneProps> = ({ script }) => {
  return (
    <section className='h-full min-h-0 flex flex-col'>
      <div className='flex items-center justify-between border-b bg-white/60 backdrop-blur px-3 py-2 shrink-0'>
        <div className='text-sm font-medium'>Script</div>
      </div>
      <div className='flex-1 bg-neutral-50 text-neutral-800'>
        <pre className='px-4 py-3 text-xs leading-5 font-mono whitespace-pre'>
          {script || '# No script available'}
        </pre>
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

interface RightTabsProps {
  active: OutputTabId
  onChange: (id: OutputTabId) => void
}

const RightTabs: React.FC<RightTabsProps> = ({ active, onChange }) => {
  return (
    <div className='border-b bg-white/70 backdrop-blur p-4 sticky top-0 z-10'>
      <div className='flex flex-col w-full items-stretch gap-2'>
        {OUTPUT_TABS.map((t) => (
          <React.Fragment key={t.id}>
            {t.enabled && (
              <button
                key={t.id}
                type='button'
                onClick={() => onChange(t.id)}
                data-active={active === t.id}
                className='text-xs rounded-md border px-2.5 py-1.5 data-[active=true]:bg-neutral-900 data-[active=true]:text-white data-[active=true]:border-neutral-900 data-[active=false]:bg-white data-[active=false]:text-neutral-700 hover:bg-neutral-50'
                aria-pressed={active === t.id}
              >
                {t.label}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

interface JobDetailsLayoutProps {
  job?: Job
  jobMetadata?: JobMetadata
  system?: System
  activeTab: OutputTabId
  stdout: string
  stdin: string
  stderr: string
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
  stdin,
  stderr,
  script,
  dashboards,
  onChangeTab,
}) => {
  return (
    <div className='flex flex-1 flex-col gap-4 pt-6 pb-20 px-8'>
      <div className='flex items-center justify-between'>
        <div className='text-sm text-neutral-500'>
          Clariden /{' '}
          <Link to={`/compute`} className='hover:text-gray-900'>
            Jobs
          </Link>{' '}
          / <span className='text-neutral-800'>{job?.jobId}</span>
        </div>
        {/* <div className='text-xs text-neutral-500'>Last update: just now</div> */}
      </div>
      <div className='flex flex-1 h-full'>
        <JobDetailCenter
          job={job}
          jobMetadata={jobMetadata}
          system={system}
          activeTab={activeTab}
          stdout={stdout}
          stdin={stdin}
          stderr={stderr}
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
  const [jobStandardError, setJobStandardError] = useState<GetOpsTailResponse | null>(null)
  const [localError, setLocalError] = useState<any>(error)
  const [activeTab, setActiveTab] = React.useState<OutputTabId>('stdout')

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
    if (jobMetadata.standardOutput !== null && jobMetadata.standardOutput !== '') {
      fetchJobFileContent(jobMetadata.standardOutput, setJobStandardOuput)
    }
    if (jobMetadata.standardError !== null && jobMetadata.standardError !== '') {
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

  return (
    // <ActiveScrollCtx.Provider value={ctxValue}>
    <JobDetailsLayout
      job={currentJob || undefined}
      jobMetadata={jobMetadata || undefined}
      system={system}
      activeTab={activeTab}
      stdout={jobStandardOuput?.output?.content || '...'}
      stdin={jobMetadata?.standardInput || ''}
      stderr={jobStandardError?.output?.content || '...'}
      script={jobMetadata?.script || undefined}
      dashboards={dashboards}
      onChangeTab={setActiveTab}
    />
    // </ActiveScrollCtx.Provider>
  )
}

export default JobDetailsConsoleView
