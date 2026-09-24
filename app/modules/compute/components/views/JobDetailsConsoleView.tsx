/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { Link } from 'react-router'
import React, { useEffect, useRef, useMemo, useState } from 'react'
import {
  ArrowDownCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronDoubleUpIcon,
  ChevronDoubleDownIcon,
  XMarkIcon,
  SignalIcon,
  QueueListIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'
// types
import type { System } from '~/types/api-status'
import { GetOpsTailResponse, GetOpsLsResponse, File } from '~/types/api-filesystem'
import { GetJobResponse, Job, JobMetadata, JobStateStatus } from '~/types/api-job'
// helpers
import { classNames } from '~/helpers/class-helper'
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
import { isMaintenanceResponse, getMaintenanceMessage } from '~/apis/api'
// grafana
import EmbedPanelGrafana from '~/modules/compute/components/grafana/EmbedPanelGrafana'
// hooks
import {
  useWindowedFileView,
  UseWindowedFileViewResult,
} from '~/modules/compute/hooks/useWindowedFileView'

// contexts
import { useGroup } from '~/contexts/GroupContext'
import { useMaintenance } from '~/contexts/MaintenanceContext'

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
    setStderrDownloadDialogOpen(true)
  }

  return (
    <>
      <JobCancelDialog
        job={job!}
        system={system?.name!}
        account={selectedGroup?.name!}
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      />
      {job && jobCanBeCanceled(job) && (
        <div className='mt-2 mb-4 flex justify-end gap-2"'>
          <button
            className='flex items-center gap-1.5 rounded-md border px-3 py-1.5 bg-red-600 text-sm font-semibold text-white shadow-sm hover:bg-red-500'
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
                  downloadLimit={
                    system?.dataOperation?.max_ops_file_size || Number.MAX_SAFE_INTEGER
                  }
                  open={stdoutDownloadDialogOpen}
                  onClose={() => setStdoutDownloadDialogOpen(false)}
                />
                <button
                  onClick={handleStdoutDownload}
                  title='Download STDOUT log'
                  className='w-8 h-8 flex items-center justify-center rounded-md border text-white bg-blue-700 hover:bg-blue-500'
                >
                  <ArrowDownCircleIcon className='w-6 h-6' />
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
                  accountName={selectedGroup?.name || ''}
                  downloadLimit={
                    system?.dataOperation?.max_ops_file_size || Number.MAX_SAFE_INTEGER
                  }
                  open={stderrDownloadDialogOpen}
                  onClose={() => setStderrDownloadDialogOpen(false)}
                />
                <button
                  onClick={handleStderrDownload}
                  title='Download STDErr log'
                  className='w-8 h-8 flex items-center justify-center rounded-md border text-white bg-blue-700 hover:bg-blue-500'
                >
                  <ArrowDownCircleIcon className='w-6 h-6' />
                </button>
              </>
            )}
          </div>
        </AttributesListItem>
        <AttributesListItem label='StdIn'>
          <div className='flex-1 min-w-0 break-words'>{jobMetadata?.standardInput || 'N/A'}</div>
        </AttributesListItem>
        <AttributesListItem label='Working directory'>
          <div className='flex-1 min-w-0 break-words'>{job?.workingDirectory || 'N/A'}</div>
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
  logMode: LogMode
  onChangeLogMode: (mode: LogMode) => void
  tailPaused: boolean
  onToggleTailPaused: () => void
  stdoutView: UseWindowedFileViewResult
  stderrView: UseWindowedFileViewResult
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
  logMode,
  onChangeLogMode,
  tailPaused,
  onToggleTailPaused,
  stdoutView,
  stderrView,
}) => {
  const [detailsOpen, setDetailsOpen] = useState(true)
  if (!dashboards || dashboards.length === 0) {
    OUTPUT_TABS.find((t) => t.id === 'resources')!.enabled = false
  }
  const isLogTab = activeTab === 'stdout' || activeTab === 'stderr'
  return (
    <div
      className='flex-1 min-h-0 rounded-xl border bg-white shadow-sm m-6 pt-2'
      style={{ marginTop: '20px' }}
    >
      <div className='flex items-center justify-between bg-white p-4 px-3 py-2 shrink-0 z-9 '>
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
        <div className='flex items-center gap-3'>
          <div className='flex items-center rounded-lg border overflow-hidden'>
            <button
              type='button'
              onClick={() => onChangeLogMode('tail')}
              disabled={!isLogTab}
              data-active={logMode === 'tail'}
              title='Show the last lines of the file and keep following new output as it arrives'
              className='flex items-center gap-1.5 px-3 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed data-[active=true]:bg-neutral-900 data-[active=true]:text-white'
            >
              <SignalIcon className='h-4 w-4' />
              Tail
            </button>
            <button
              type='button'
              onClick={() => onChangeLogMode('view')}
              disabled={!isLogTab}
              data-active={logMode === 'view'}
              title='Page through the file in windows instead of downloading it whole - better suited to large files'
              className='flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-l disabled:opacity-40 disabled:cursor-not-allowed data-[active=true]:bg-neutral-900 data-[active=true]:text-white'
            >
              <QueueListIcon className='h-4 w-4' />
              View
            </button>
          </div>
        </div>
      </div>
      <div className='min-w-0 min-h-[50vh] pt-4 flex flex-col lg:h-full lg:min-h-0'>
        {activeTab === 'stdout' &&
          (logMode === 'tail' ? (
            <ConsolePane
              content={stdout}
              tailPaused={tailPaused}
              onToggleTailPaused={onToggleTailPaused}
            />
          ) : (
            <WindowedConsolePane
              view={stdoutView}
              tailPaused={tailPaused}
              onToggleTailPaused={onToggleTailPaused}
            />
          ))}
        {activeTab === 'stdin' && <ConsolePane content={stdin} />}
        {activeTab === 'stderr' &&
          (logMode === 'tail' ? (
            <ConsolePane
              content={stderr}
              tailPaused={tailPaused}
              onToggleTailPaused={onToggleTailPaused}
            />
          ) : (
            <WindowedConsolePane
              view={stderrView}
              tailPaused={tailPaused}
              onToggleTailPaused={onToggleTailPaused}
            />
          ))}
        {activeTab === 'script' && <ConsolePane content={script} />}
        {activeTab === 'resources' && dashboards && dashboards.length > 0 && (
          <ResourcesPaneMulti job={job!} dashboards={dashboards} title='Resources' />
        )}
      </div>
      <aside className='w-full border-t bg-white mt-6 lg:fixed lg:right-0 lg:top-16 lg:bottom-12 lg:w-[30rem] lg:mt-0 lg:border-t-0 lg:border-l lg:overflow-y-auto'>
        <button
          type='button'
          className='flex w-full items-center justify-between p-4 text-left font-semibold lg:hidden'
          onClick={() => setDetailsOpen((open) => !open)}
          aria-expanded={detailsOpen}
        >
          <span>Job details</span>
          <ChevronDownIcon
            className={classNames('h-5 w-5 transition-transform', detailsOpen ? 'rotate-180' : '')}
            aria-hidden='true'
          />
        </button>
        <div className={classNames(detailsOpen ? 'block' : 'hidden', 'p-4 lg:block')}>
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

// Normalizes line endings the same way for both the tail-based and windowed-view console panes.
const cleanConsoleContent = (content?: string): string | null => {
  if (!content) return null
  return content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => {
      const parts = line.split('\r')
      return parts[parts.length - 1]
    })
    .join('\n')
}

// Shared by ConsolePane's and WindowedConsolePane's header rows so both panes come out exactly
// the same height regardless of which mode is active. overflow-x-auto is a safety net for very
// narrow viewports - whitespace-nowrap on the buttons below is what actually keeps the row a
// single line in the first place (without it, a button's own label text wraps to two lines
// before the row would ever need to scroll, growing the row's height either way).
const CONSOLE_TOOLBAR_ROW_CLASS =
  'flex items-center justify-between gap-2 border-b bg-white px-3 py-2 shrink-0 text-sm text-neutral-600 overflow-x-auto'
const CONSOLE_TOOLBAR_BUTTON_CLASS =
  'flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed shrink-0'

interface LiveTailingControlProps {
  tailPaused: boolean
  onToggleTailPaused: () => void
}

// Shared by ConsolePane's and WindowedConsolePane's header rows - always grouped together (the
// dot/label right next to the button it explains) so both panes read the same way regardless of
// mode.
const LiveTailingControl: React.FC<LiveTailingControlProps> = ({
  tailPaused,
  onToggleTailPaused,
}) => (
  <div className='flex items-center gap-3'>
    <div className='flex items-center gap-1.5 whitespace-nowrap shrink-0'>
      <span
        className={classNames(
          'inline-block h-2 w-2 rounded-full',
          tailPaused ? 'bg-neutral-400' : 'bg-green-500',
        )}
        aria-hidden='true'
      />
      {tailPaused ? 'Paused' : 'Live'}
    </div>
    <button type='button' onClick={onToggleTailPaused} className={CONSOLE_TOOLBAR_BUTTON_CLASS}>
      {tailPaused ? <PlayIcon className='h-4 w-4' /> : <PauseIcon className='h-4 w-4' />}
      {tailPaused ? 'Resume tailing' : 'Pause tailing'}
    </button>
  </div>
)

interface ConsolePaneProps {
  content?: string
  // Only provided for the stdout/stderr tabs - when omitted, this pane skips the header row
  // entirely (e.g. StdIn/Script tabs, where live tailing doesn't apply).
  tailPaused?: boolean
  onToggleTailPaused?: () => void
}

const ConsolePane: React.FC<ConsolePaneProps> = ({ content, tailPaused, onToggleTailPaused }) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  // The "was I already near the bottom" check below is unsatisfiable on the very first render -
  // scrollTop starts at 0, so with more than a screenful of content it always reads as "not near
  // bottom" and the initial tail never actually lands at the bottom. Force it once.
  const hasScrolledOnceRef = useRef(false)

  const cleanedContent = useMemo(() => cleanConsoleContent(content), [content])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    if (!hasScrolledOnceRef.current && cleanedContent) {
      el.scrollTop = el.scrollHeight
      hasScrolledOnceRef.current = true
      return
    }
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [cleanedContent])

  return (
    <section className='flex-1 min-h-0 flex flex-col'>
      {onToggleTailPaused && (
        <div className={CONSOLE_TOOLBAR_ROW_CLASS}>
          <div />
          <LiveTailingControl tailPaused={!!tailPaused} onToggleTailPaused={onToggleTailPaused} />
        </div>
      )}
      <div
        ref={scrollerRef}
        className='flex-1 min-h-0 bg-black text-neutral-100 font-mono text-[12px] leading-5 overflow-auto'
      >
        <pre className='px-3 py-2 whitespace-pre-wrap'>
          {cleanedContent || '# No data available'}
        </pre>
      </div>
    </section>
  )
}

interface WindowedConsolePaneProps {
  view: UseWindowedFileViewResult
  // Shared with ConsolePane's tail-mode polling: pausing stops auto-refresh while anchored at
  // EOF (only time this view auto-updates), same "follow the live log" toggle either way.
  tailPaused: boolean
  onToggleTailPaused: () => void
}

// Byte-windowed counterpart to ConsolePane: paged navigation instead of a fixed tail, backed by
// useWindowedFileView. Preserves the user's visual scroll position on "load earlier" (which
// prepends above the current viewport) by measuring scrollHeight before the fetch and correcting
// scrollTop by the delta once the new content has rendered, rather than trying to infer a
// prepend/append from the content itself.
const WindowedConsolePane: React.FC<WindowedConsolePaneProps> = ({
  view,
  tailPaused,
  onToggleTailPaused,
}) => {
  const {
    content,
    loading,
    loadingReplace,
    loadingEarlier,
    loadingLater,
    error,
    atEnd,
    loadEarlier,
    loadLater,
    jumpToEnd,
    jumpToStart,
  } = view
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  // Set right before jumpToStart/jumpToEnd/loadEarlier, which all land the buffer's new content
  // at the very start - tells the effect below to scroll there once it renders, rather than
  // falling through to the "was I near the bottom" heuristic used for auto-refresh.
  const pendingJumpRef = useRef<'start' | 'end' | null>(null)
  // Set right before loadLater, to the pre-fetch scrollHeight - since content is only ever
  // appended, that's exactly where the newly-loaded content starts, so scrolling there brings
  // it into view instead of leaving the scroll position wherever it happened to be.
  const pendingRevealFromRef = useRef<number | null>(null)
  // The hook always anchors at EOF on its very first fetch (see useWindowedFileView), but the
  // "was I already near the bottom" heuristic below can't know that - scrollTop starts at 0, so
  // with more than a screenful of content the first load would otherwise land at the top of the
  // tail window instead of the bottom.
  const hasScrolledOnceRef = useRef(false)

  const cleanedContent = useMemo(() => cleanConsoleContent(content), [content])

  // A small tolerance for float scrollTop/scrollHeight rounding, not a "close enough" threshold -
  // anything above this means there's genuinely more already-rendered content off-screen.
  const EDGE_EPSILON_PX = 2

  const handleLoadEarlier = () => {
    const el = scrollerRef.current
    // The buffer only ever grows (never evicted), so after paging backward a few times it can
    // easily hold much more than one screenful. If there's already-loaded content above the
    // current scroll position, reveal it by scrolling - no fetch needed, and nothing for the
    // buffer's actual bufferStart to have moved, which is exactly why a click could otherwise
    // look like it "did nothing" despite being nowhere near the real start of the file.
    if (el && el.scrollTop > EDGE_EPSILON_PX) {
      el.scrollTop = Math.max(0, el.scrollTop - el.clientHeight)
      return
    }
    // Already at the top of what's currently rendered - fetch the previous page (a no-op if the
    // buffer has already reached byte 0).
    pendingJumpRef.current = 'start'
    loadEarlier()
  }

  const handleLoadLater = () => {
    const el = scrollerRef.current
    // Symmetric with handleLoadEarlier above.
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight > EDGE_EPSILON_PX) {
      el.scrollTop = Math.min(el.scrollHeight - el.clientHeight, el.scrollTop + el.clientHeight)
      return
    }
    // Already at the bottom of what's currently rendered - fetch the next page. Skipped once we
    // already know we're at the live end (atEnd), since that fetch would just re-confirm the same
    // position - the background auto-refresh (not this handler) is what watches for new growth.
    if (atEnd) return
    if (el) {
      pendingRevealFromRef.current = el.scrollHeight
    }
    loadLater()
  }

  const handleJumpToStart = () => {
    pendingJumpRef.current = 'start'
    jumpToStart()
  }

  const handleJumpToEnd = () => {
    pendingJumpRef.current = 'end'
    jumpToEnd()
  }

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const isFirstLoad = !hasScrolledOnceRef.current && !!cleanedContent
    if (cleanedContent) hasScrolledOnceRef.current = true
    if (isFirstLoad) {
      el.scrollTop = el.scrollHeight
      return
    }
    if (pendingJumpRef.current) {
      el.scrollTop = pendingJumpRef.current === 'start' ? 0 : el.scrollHeight
      pendingJumpRef.current = null
      return
    }
    if (pendingRevealFromRef.current !== null) {
      // If this load-later just reached the live end, land at the true bottom rather than the
      // top of the newly-revealed page - otherwise the buttons correctly show "nothing more to
      // load" while the pane still looks like there's unseen content below the fold.
      el.scrollTop = atEnd ? el.scrollHeight : pendingRevealFromRef.current
      pendingRevealFromRef.current = null
      return
    }
    // Otherwise this is an auto-refresh append while anchored at EOF - only follow it to the
    // bottom if the user was already near the bottom (they may have paged away in the meantime).
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [cleanedContent, atEnd])

  return (
    <section className='flex-1 min-h-0 flex flex-col'>
      <div className={CONSOLE_TOOLBAR_ROW_CLASS}>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={handleJumpToStart}
            // Deliberately not gated on atStart/ready: keeping button enablement in sync with
            // buffer position (which the background auto-refresh mutates independently) proved
            // fragile in practice. Instead the buttons stay clickable and the hook's own guards
            // (e.g. loadEarlier bailing out at bufferStart === 0) make an already-there click a
            // no-op - only "is my own request already in flight" disables a button.
            disabled={loadingReplace}
            className={CONSOLE_TOOLBAR_BUTTON_CLASS}
            title='Load the beginning of the file'
          >
            <ChevronDoubleUpIcon className='h-4 w-4' />
            Load top
          </button>
          <button
            type='button'
            onClick={handleLoadEarlier}
            // See Load top above - not gated on atStart/ready, the hook no-ops if there's
            // nothing earlier to fetch (or no position known yet).
            disabled={loadingReplace || loadingEarlier}
            className={CONSOLE_TOOLBAR_BUTTON_CLASS}
          >
            <ChevronUpIcon className='h-4 w-4' />
            Load earlier
          </button>
          <button
            type='button'
            onClick={handleLoadLater}
            // See Load top above - not gated on atEnd/ready, the hook no-ops (or just re-confirms
            // the same live end) if there's nothing later to fetch yet.
            disabled={loadingReplace || loadingLater}
            className={CONSOLE_TOOLBAR_BUTTON_CLASS}
          >
            <ChevronDownIcon className='h-4 w-4' />
            Load later
          </button>
          <button
            type='button'
            onClick={handleJumpToEnd}
            // See Load top above.
            disabled={loadingReplace}
            className={CONSOLE_TOOLBAR_BUTTON_CLASS}
            title='Load the end of the file'
          >
            <ChevronDoubleDownIcon className='h-4 w-4' />
            Load bottom
          </button>
        </div>
        <div className='whitespace-nowrap'>
          {error ? 'Failed to load file window' : loading ? 'Loading…' : null}
        </div>
        <LiveTailingControl tailPaused={tailPaused} onToggleTailPaused={onToggleTailPaused} />
      </div>
      <div
        ref={scrollerRef}
        className='flex-1 min-h-0 bg-black text-neutral-100 font-mono text-[12px] leading-5 overflow-auto'
      >
        <pre className='px-3 py-2 whitespace-pre-wrap'>
          {cleanedContent || '# No data available'}
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
    <section className='flex-1 min-h-0 flex flex-col'>
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
    <section className='flex-1 min-h-0 flex flex-col'>
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

// 'tail' mirrors today's behaviour (last N lines, polled while the job runs). 'view' pages
// through the file with GET /ops/view, anchored at EOF by default - see
// project_windowed_log_preview_assessment memory for the design discussion behind this.
type LogMode = 'tail' | 'view'

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
  logMode: LogMode
  onChangeLogMode: (mode: LogMode) => void
  tailPaused: boolean
  onToggleTailPaused: () => void
  stdoutView: UseWindowedFileViewResult
  stderrView: UseWindowedFileViewResult
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
  logMode,
  onChangeLogMode,
  tailPaused,
  onToggleTailPaused,
  stdoutView,
  stderrView,
}) => {
  return (
    <div className='flex flex-1 min-h-0 flex-col gap-4 pb-20'>
      <div className='flex flex-1 h-full min-h-0'>
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
          logMode={logMode}
          onChangeLogMode={onChangeLogMode}
          tailPaused={tailPaused}
          onToggleTailPaused={onToggleTailPaused}
          stdoutView={stdoutView}
          stderrView={stderrView}
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
  defaultLogMode?: string
}

const JobDetailsConsoleView: React.FC<JobDetailsConsoleViewProps> = ({
  jobs,
  jobsMetadata,
  system,
  error,
  dashboard,
  defaultLogMode,
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
  const [logMode, setLogMode] = useState<LogMode>(defaultLogMode === 'view' ? 'view' : 'tail')
  const [tailPaused, setTailPaused] = useState(false)
  const { setMaintenance } = useMaintenance()

  const isJobActive =
    currentJob !== null &&
    ![JobStateStatus.COMPLETED, JobStateStatus.FAILED].includes(currentJob.status.state)

  // Shared with tail mode's own polling - pausing "follows the live log" regardless of which
  // mode you're currently looking at it through.
  const viewAutoRefreshIntervalMs = isJobActive && !tailPaused ? 2000 : null

  const stdoutView = useWindowedFileView({
    systemName: system?.name,
    filePath: jobMetadata?.standardOutput,
    enabled: logMode === 'view',
    autoRefreshIntervalMs: viewAutoRefreshIntervalMs,
  })
  const stderrView = useWindowedFileView({
    systemName: system?.name,
    filePath: jobMetadata?.standardError,
    enabled: logMode === 'view',
    autoRefreshIntervalMs: viewAutoRefreshIntervalMs,
  })

  const handlePollingError = async (error: any) => {
    if (isMaintenanceResponse(error)) {
      setMaintenance(true, await getMaintenanceMessage(error))
    } else {
      setLocalError(error)
    }
  }

  const fetchJob = async (
    jobId: number,
    setter: React.Dispatch<React.SetStateAction<Job | null>>,
  ) => {
    try {
      const response: GetJobResponse = await getLocalJob(system.name, jobId)
      const [job] = response.jobs
      setter(job)
    } catch (error) {
      await handlePollingError(error)
    }
  }

  const fetchJobFileContent = async (
    filePath: string,
    setter: React.Dispatch<React.SetStateAction<GetOpsTailResponse | null>>,
  ) => {
    try {
      const response: GetOpsTailResponse = await getLocalOpsTail(system.name, filePath, '500')
      setter(response)
    } catch (error) {
      await handlePollingError(error)
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
      await handlePollingError(error)
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
            // The file metadata (for the download button) is independent of log mode/pause -
            // only the tail content fetch itself is gated. In 'view' mode, useWindowedFileView
            // fetches its own content separately.
            if (logMode === 'tail' && !tailPaused) {
              fetchJobStandardFileContent(jobMetadata)
            }
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
  }, [job, logMode, tailPaused])

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
    // </ActiveScrollCtx.Provider>
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
      logMode={logMode}
      onChangeLogMode={setLogMode}
      tailPaused={tailPaused}
      onToggleTailPaused={() => setTailPaused((paused) => !paused)}
      stdoutView={stdoutView}
      stderrView={stderrView}
    />
  )
}

export default JobDetailsConsoleView
