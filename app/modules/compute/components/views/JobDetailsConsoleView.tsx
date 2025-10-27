/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useEffect, useRef, useMemo, useState } from 'react'
// types
import { Job, JobMetadata } from '~/types/api-job'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
import JobStateBadge from '~/modules/compute/components/badges/JobStateBadge'
// lists
import { AttributesList, AttributesListItem } from '~/components/lists/AttributesList'

const ActiveScrollCtx = React.createContext<{ setActive: (el: HTMLElement | null) => void } | null>(
  null,
)

function useRegisterActiveScroller(ref: React.RefObject<HTMLElement>) {
  const ctx = React.useContext(ActiveScrollCtx)
  React.useEffect(() => {
    if (!ctx) return
    if (ref.current) ctx.setActive(ref.current)
    const el = ref.current
    const onEnter = () => ctx.setActive(ref.current)
    el?.addEventListener('mouseenter', onEnter)
    el?.addEventListener('touchstart', onEnter, { passive: true })
    return () => {
      el?.removeEventListener('mouseenter', onEnter)
      el?.removeEventListener('touchstart', onEnter)
    }
  }, [ctx, ref])
}

interface JobDetailsPanelProps {
  job?: Job
  jobMetadata?: JobMetadata
}

const JobDetailsPanel: React.FC<JobDetailsPanelProps> = ({ job, jobMetadata }) => {
  return (
    <>
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
      <div className='mt-4'>
        <button className='w-full rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50'>
          Cancel job
        </button>
      </div>
    </>
  )
}

interface JobDetailCenterProps {
  job?: Job
  jobMetadata?: JobMetadata
  activeTab: OutputTabId
  stdout: string[]
  stderr: string[]
  script?: string
  onChangeTab: (id: OutputTabId) => void
}

const JobDetailCenter: React.FC<JobDetailCenterProps> = ({
  job,
  jobMetadata,
  activeTab,
  stdout,
  stderr,
  script,
  onChangeTab,
}) => {
  return (
    <div className='flex flex-1 rounded-xl border bg-white/70 shadow-sm min-h-0 h-full'>
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
      <aside className='w-120 shrink-0 border-l bg-white sticky top-14 self-start max-h-[calc(100vh-56px)] overflow-y-auto'>
        <RightTabs active={activeTab} onChange={onChangeTab} />
        <div className='p-4'>
          <JobDetailsPanel job={job} jobMetadata={jobMetadata} />
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
  useRegisterActiveScroller(scrollerRef as React.RefObject<HTMLElement>)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [lines])

  return (
    <section className='h-full min-h-0 flex flex-col'>
      <div className='flex items-center justify-between border-b bg-white/60 backdrop-blur px-3 py-2 shrink-0'>
        <div className='text-sm font-medium'>{title}</div>
        <div className='flex items-center gap-2 text-xs'></div>
      </div>
      <div
        ref={scrollerRef}
        className='flex-1 overflow-y-auto bg-black text-neutral-100 font-mono text-[12px] leading-5'
      >
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
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  useRegisterActiveScroller(scrollerRef as React.RefObject<HTMLElement>)
  return (
    <section className='h-full min-h-0 flex flex-col'>
      <div className='flex items-center justify-between border-b bg-white/60 backdrop-blur px-3 py-2 shrink-0'>
        <div className='text-sm font-medium'>Script</div>
      </div>
      <div ref={scrollerRef} className='flex-1 overflow-y-auto bg-neutral-50 text-neutral-800'>
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
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  useRegisterActiveScroller(scrollerRef as React.RefObject<HTMLElement>)
  return (
    <section className='h-full min-h-0 flex flex-col'>
      <div className='flex items-center justify-between border-b bg-white px-3 py-2 shrink-0'>
        <div className='text-sm font-medium'>{title || 'Resources'}</div>
      </div>
      <div ref={scrollerRef} className='flex-1 overflow-y-auto bg-white'>
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

  const scrollerRef = useRef<HTMLDivElement | null>(null)
  useRegisterActiveScroller(scrollerRef as React.RefObject<HTMLElement>)

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

      <div ref={scrollerRef} className='flex-1 overflow-y-auto bg-white'>
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
  activeTab: OutputTabId
  stdout: string[]
  stderr: string[]
  script?: string
  onChangeTab: (id: OutputTabId) => void
}

const JobDetailsLayout: React.FC<JobDetailsLayoutProps> = ({
  job,
  jobMetadata,
  activeTab,
  stdout,
  stderr,
  script,
  onChangeTab,
}) => {
  return (
    <div className='flex h-full flex-col gap-4 py-6 px-8'>
      <div className='flex items-center justify-between'>
        <div className='text-sm text-neutral-500'>
          Clariden / Jobs / <span className='text-neutral-800'>my-job-123</span>
        </div>
        <div className='text-xs text-neutral-500'>Last update: just now</div>
      </div>
      <div className='min-h-0 flex-1 h-full'>
        <JobDetailCenter
          job={job}
          jobMetadata={jobMetadata}
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
