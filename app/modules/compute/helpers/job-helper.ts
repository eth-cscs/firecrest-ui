/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/
// types
import { Job } from '~/types/api-job'

export const sortJobs = (jobs: Job[]) => [...jobs].sort((a, b) => Number(b.jobId) - Number(a.jobId))

// Backend limit for the jobs `name` filter (based on OpenPBS); longer values get a 422.
export const JOB_NAME_FILTER_MAX_LENGTH = 235

// Trims and caps a job name filter so the backend never sees a value it would reject.
export const normalizeJobNameFilter = (value: string | null | undefined): string =>
  (value ?? '').trim().slice(0, JOB_NAME_FILTER_MAX_LENGTH)

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
