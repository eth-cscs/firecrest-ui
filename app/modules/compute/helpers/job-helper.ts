/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/
// types
import { Job } from '~/types/api-job'

export const sortJobs = (jobs: Job[]) => [...jobs].sort((a, b) => Number(b.jobId) - Number(a.jobId))

// Longest search text kept from the URL or the search box, so a hand-edited link can't make the
// list match against an absurdly long string on every poll.
export const JOB_SEARCH_MAX_LENGTH = 256

// Trims and caps the search text.
export const normalizeJobSearch = (value: string | null | undefined): string =>
  (value ?? '').trim().slice(0, JOB_SEARCH_MAX_LENGTH)

// Splits the search text into lowercase terms. Every term must match (AND), so "train 1234"
// narrows the list instead of widening it.
const getJobSearchTerms = (search: string): string[] =>
  normalizeJobSearch(search).toLowerCase().split(/\s+/).filter(Boolean)

// Case-insensitive substring search on the job name and ID. It runs in the browser over the jobs
// already loaded: the backend only supports an exact name filter, and the scheduler has no
// full-text search.
export const jobMatchesSearch = (job: Job, search: string): boolean => {
  const terms = getJobSearchTerms(search)
  if (terms.length === 0) return true
  const haystack = `${job.name ?? ''}\n${job.jobId ?? ''}`.toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

// Status filter groups. "failed" is for jobs that ended in an error. "finished" covers every
// other end state (completed, cancelled, timeout, preempted...), and any state not listed below.
export const JOB_STATUS_FILTERS = ['running', 'pending', 'failed', 'finished'] as const

export type JobStatusFilter = (typeof JOB_STATUS_FILTERS)[number]

export const JOB_STATUS_FILTER_LABELS: Record<JobStatusFilter, string> = {
  running: 'Running',
  pending: 'Pending',
  failed: 'Failed',
  finished: 'Finished',
}

// Slurm state names, plus the single-letter PBS codes the backend passes through unchanged.
const PENDING_STATES = new Set([
  'PENDING',
  'REQUEUED',
  'REQUEUE_HOLD',
  'REQUEUE_FED',
  'RESV_DEL_HOLD',
  // PBS: queued, held, waiting, in transit, moved
  'Q',
  'H',
  'W',
  'T',
  'M',
])
const RUNNING_STATES = new Set([
  'RUNNING',
  'CONFIGURING',
  'COMPLETING',
  'SUSPENDED',
  'STOPPED',
  'SIGNALING',
  'STAGE_OUT',
  'RESIZING',
  // PBS: running, exiting, suspended, array begun
  'R',
  'E',
  'S',
  'U',
  'B',
])
// Slurm end states caused by an error. PBS reports every ended job as "F" (the exit status is a
// separate field), so PBS jobs never land here.
const FAILED_STATES = new Set(['FAILED', 'OUT_OF_MEMORY', 'NODE_FAIL', 'BOOT_FAIL'])

// The state can carry extra text (e.g. "CANCELLED by 12345"), so only the first word counts.
export const getJobStatusGroup = (state: string | null | undefined): JobStatusFilter => {
  const key = (state ?? '').trim().split(/\s+/)[0].toUpperCase()
  if (PENDING_STATES.has(key)) return 'pending'
  if (RUNNING_STATES.has(key)) return 'running'
  if (FAILED_STATES.has(key)) return 'failed'
  return 'finished'
}

// Turns a URL value into a known status filter, or null (no status filter) when missing or
// unknown, so an outdated link still opens a working list.
export const normalizeJobStatusFilter = (
  value: string | null | undefined,
): JobStatusFilter | null =>
  (JOB_STATUS_FILTERS as readonly string[]).includes(value ?? '')
    ? (value as JobStatusFilter)
    : null

// Applies the in-browser search and status filters.
export const filterJobs = (jobs: Job[], search: string, status: JobStatusFilter | null): Job[] =>
  jobs.filter(
    (job) =>
      (status === null || getJobStatusGroup(job.status?.state) === status) &&
      jobMatchesSearch(job, search),
  )

// History windows accepted by the backend's `time_window` jobs parameter (any other value gets a
// 422). They only limit finished jobs: pending and running jobs are always returned.
export const JOB_TIME_WINDOWS = ['1h', '8h', '24h', '3d', '7d'] as const

export type JobTimeWindow = (typeof JOB_TIME_WINDOWS)[number]

// Same default the backend applies when the parameter is missing.
export const DEFAULT_JOB_TIME_WINDOW: JobTimeWindow = '24h'

export const JOB_TIME_WINDOW_LABELS: Record<JobTimeWindow, string> = {
  '1h': 'Last hour',
  '8h': 'Last 8 hours',
  '24h': 'Last 24 hours',
  '3d': 'Last 3 days',
  '7d': 'Last 7 days',
}

const JOB_TIME_WINDOW_SECONDS: Record<JobTimeWindow, number> = {
  '1h': 60 * 60,
  '8h': 8 * 60 * 60,
  '24h': 24 * 60 * 60,
  '3d': 3 * 24 * 60 * 60,
  '7d': 7 * 24 * 60 * 60,
}

// Start of the window as a Unix timestamp (seconds). The backend counts back from the time of
// each request, so the window slides forward with every poll.
export const getJobTimeWindowStart = (window: JobTimeWindow, nowMs: number = Date.now()): number =>
  Math.floor(nowMs / 1000) - JOB_TIME_WINDOW_SECONDS[window]

// Turns a URL value into a window the backend accepts, falling back to the default, so a
// hand-edited or outdated link still opens a working list.
export const normalizeJobTimeWindow = (value: string | null | undefined): JobTimeWindow =>
  (JOB_TIME_WINDOWS as readonly string[]).includes(value ?? '')
    ? (value as JobTimeWindow)
    : DEFAULT_JOB_TIME_WINDOW
