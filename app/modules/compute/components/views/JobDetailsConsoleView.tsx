/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useEffect, useRef, useMemo, useState } from 'react'
import { ArrowDownCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
// types
import type { System } from '~/types/api-status'
import { Job, JobMetadata } from '~/types/api-job'
// helpers
import { formatTime } from '~/helpers/time-helper'
import { formatDateTimeFromTimestamp } from '~/helpers/date-helper'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
import JobStateBadge from '~/modules/compute/components/badges/JobStateBadge'
// lists
import { AttributesList, AttributesListItem } from '~/components/lists/AttributesList'

const ActiveScrollCtx = React.createContext<{ setActive: (el: HTMLElement | null) => void } | null>(
  null,
)

interface JobDetailsPanelProps {
  job?: Job
  jobMetadata?: JobMetadata
  system?: System
}

const JobDetailsPanel: React.FC<JobDetailsPanelProps> = ({ job, jobMetadata, system }) => {
  return (
    <>
      <div className='mt-2 mb-4 flex justify-end gap-2"'>
        <button className='flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'>
          <XMarkIcon className='w-4 h-4' />
          Cancel job
        </button>
      </div>
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

// const Tabs

interface JobDetailCenterProps {
  job?: Job
  jobMetadata?: JobMetadata
  system?: System
  activeTab: OutputTabId
  stdout: string[]
  stderr: string[]
  script?: string
  onChangeTab: (id: OutputTabId) => void
}

const JobDetailCenter: React.FC<JobDetailCenterProps> = ({
  job,
  jobMetadata,
  system,
  activeTab,
  stdout,
  stderr,
  script,
  onChangeTab,
}) => {
  return (
    <div className='flex flex-1 rounded-xl border bg-white/70 shadow-sm'>
      <div className='flex-1 min-w-0 h-full min-h-0'>
        {activeTab === 'stdout' && <ConsolePane title='Job output – STDOUT' lines={stdout} />}
        {activeTab === 'stderr' && <ConsolePane title='Job output – STDERR' lines={stderr} />}
        {activeTab === 'script' && <ScriptPane script={script} />}
        {activeTab === 'resources' && (
          <ResourcesPaneMulti
            dashboards={[
              {
                id: '1',
                label: 'CPU usage (%) per node',
                src: 'https://firecrest.grafana.tds.cscs.ch/d-solo/job-fake-telemetry/firecrest-e28094-job-fake-telemetry?orgId=1&from=1761049637906&to=1761051437906&timezone=browser&refresh=5s&panelId=1&__feature.dashboardSceneSolo=true',
              },
              {
                id: '2',
                label: 'Node temperature (°C)',
                src: 'https://firecrest.grafana.tds.cscs.ch/d-solo/job-fake-telemetry/firecrest-e28094-job-fake-telemetry?orgId=1&from=1761050389412&to=1761052189412&timezone=browser&refresh=5s&panelId=2&__feature.dashboardSceneSolo=true',
              },
              {
                id: '3',
                label: 'Memory RSS (GB)',
                src: 'https://firecrest.grafana.tds.cscs.ch/d-solo/job-fake-telemetry/firecrest-e28094-job-fake-telemetry?orgId=1&from=1761050369403&to=1761052169403&timezone=browser&refresh=5s&panelId=3&__feature.dashboardSceneSolo=true',
              },
            ]}
            title='Resources'
          />
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
  lines: string[]
}

const ConsolePane: React.FC<ConsolePaneProps> = ({ title, lines }) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [lines])

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
        <pre className='px-3 py-2 whitespace-pre-wrap'>
          {`$ tail -f job.log
`}
          {lines.map((l, i) => (
            <span key={i} className='block'>
              {l}
            </span>
          ))}
        </pre>
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

interface ResourcesPaneProps {
  src?: string
  title?: string
}

const ResourcesPane: React.FC<ResourcesPaneProps> = ({ src, title }) => {
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

interface ResourcesPaneMultiProps {
  dashboards: GrafanaDashboard[]
  title?: string
}

const ResourcesPaneMulti: React.FC<ResourcesPaneMultiProps> = ({ dashboards, title }) => {
  const [activeId, setActiveId] = React.useState<string>(dashboards?.[0]?.id ?? '')
  const [showAll, setShowAll] = React.useState(true)
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
          <label className='flex items-center gap-1 text-xs text-neutral-600'>
            <input
              type='checkbox'
              className='accent-neutral-800'
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            Show all
          </label>
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
                <iframe
                  src={d.src}
                  className='w-full h-[600px] border-0'
                  title={d.label}
                  loading='lazy'
                  referrerPolicy='no-referrer'
                />
              </div>
            ))}
          </div>
        ) : (
          <iframe
            key={active?.id}
            src={active?.src}
            className='w-full h-full min-h-[600px] border-0'
            title={active?.label || 'Grafana dashboard'}
            loading='lazy'
            referrerPolicy='no-referrer'
          />
        )}
      </div>
    </section>
  )
}

const OUTPUT_TABS = [
  { id: 'stdout', label: 'STD OUT' },
  { id: 'stderr', label: 'STD ERR' },
  { id: 'script', label: 'SCRIPT' },
  { id: 'resources', label: 'RESOURCES' },
] as const

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
  stdout: string[]
  stderr: string[]
  script?: string
  onChangeTab: (id: OutputTabId) => void
}

const JobDetailsLayout: React.FC<JobDetailsLayoutProps> = ({
  job,
  jobMetadata,
  system,
  activeTab,
  stdout,
  stderr,
  script,
  onChangeTab,
}) => {
  return (
    <div className='flex flex-1 flex-col gap-4 pt-6 pb-20 px-8'>
      {/* <div className='flex items-center justify-between'>
        <div className='text-sm text-neutral-500'>
          Clariden / Jobs / <span className='text-neutral-800'>my-job-123</span>
        </div>
        <div className='text-xs text-neutral-500'>Last update: just now</div>
      </div> */}
      <div className='flex flex-1 h-full'>
        <JobDetailCenter
          job={job}
          jobMetadata={jobMetadata}
          system={system}
          activeTab={activeTab}
          stdout={stdout}
          stderr={stderr}
          script={script}
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
  const [stdout, setStdout] = React.useState<string[]>([
    '[09:01:00] Job started...',
    '[09:01:01] Allocating nodes...',
    '[09:01:02] Pulling container image...',
  ])
  const [stderr, setStderr] = React.useState<string[]>(['[09:01:05] WARN: minor network jitter'])
  const [activeTab, setActiveTab] = React.useState<OutputTabId>('stdout')
  const script = '#!/bin/bash\nsrun --pty bash\n'
  const activeRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date().toLocaleTimeString()
      setStdout((prev) =>
        prev.length > 300
          ? [...prev.slice(-250), `[${now}] run: step ok`]
          : [...prev, `[${now}] run: step ok`],
      )
      if (Math.random() < 0.35) {
        setStderr((prev) =>
          prev.length > 200
            ? [...prev.slice(-150), `[${now}] ERROR: retrying op`]
            : [...prev, `[${now}] ERROR: retrying op`],
        )
      }
    }, 600)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!activeRef.current) return
      activeRef.current.scrollBy({ top: e.deltaY, behavior: 'auto' })
      e.preventDefault()
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel as any)
  }, [])

  const ctxValue = useMemo(
    () => ({
      setActive: (el: HTMLElement | null) => {
        activeRef.current = el
      },
    }),
    [],
  )

  return (
    <ActiveScrollCtx.Provider value={ctxValue}>
      <JobDetailsLayout
        job={currentJob || undefined}
        jobMetadata={jobMetadata || undefined}
        system={system}
        activeTab={activeTab}
        stdout={stdout}
        stderr={stderr}
        script={script}
        onChangeTab={setActiveTab}
      />
    </ActiveScrollCtx.Provider>
  )
}

export default JobDetailsConsoleView
