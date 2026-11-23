/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { Job } from '~/types/api-job'
import {
  normalizeJobSearch,
  jobMatchesSearch,
  getJobStatusGroup,
  normalizeJobStatusFilter,
  filterJobs,
  normalizeJobTimeWindow,
  getJobTimeWindowStart,
  JOB_SEARCH_MAX_LENGTH,
  JOB_STATUS_FILTERS,
  JOB_TIME_WINDOWS,
  DEFAULT_JOB_TIME_WINDOW,
} from '~/modules/compute/helpers/job-helper'

// Only the fields the filters read.
const makeJob = (jobId: string, name: string, state: string): Job =>
  ({ jobId, name, status: { state } }) as unknown as Job

describe('normalizeJobTimeWindow', () => {
  it('keeps every window the backend accepts', () => {
    for (const window of JOB_TIME_WINDOWS) {
      expect(normalizeJobTimeWindow(window)).toBe(window)
    }
  })

  it('falls back to the default for missing or unknown values', () => {
    expect(normalizeJobTimeWindow(null)).toBe(DEFAULT_JOB_TIME_WINDOW)
    expect(normalizeJobTimeWindow(undefined)).toBe(DEFAULT_JOB_TIME_WINDOW)
    expect(normalizeJobTimeWindow('')).toBe(DEFAULT_JOB_TIME_WINDOW)
    expect(normalizeJobTimeWindow('30m')).toBe(DEFAULT_JOB_TIME_WINDOW)
    expect(normalizeJobTimeWindow('24H')).toBe(DEFAULT_JOB_TIME_WINDOW)
  })

  it('uses the same default as the backend', () => {
    expect(DEFAULT_JOB_TIME_WINDOW).toBe('24h')
  })
})

describe('getJobTimeWindowStart', () => {
  const now = Date.UTC(2026, 10, 10, 12, 0, 0)
  const nowSeconds = now / 1000

  it('counts back from now by the window length', () => {
    expect(getJobTimeWindowStart('1h', now)).toBe(nowSeconds - 3600)
    expect(getJobTimeWindowStart('8h', now)).toBe(nowSeconds - 8 * 3600)
    expect(getJobTimeWindowStart('24h', now)).toBe(nowSeconds - 24 * 3600)
    expect(getJobTimeWindowStart('3d', now)).toBe(nowSeconds - 3 * 86400)
    expect(getJobTimeWindowStart('7d', now)).toBe(nowSeconds - 7 * 86400)
  })

  it('returns whole seconds', () => {
    expect(Number.isInteger(getJobTimeWindowStart('1h', now + 999))).toBe(true)
  })
})

describe('normalizeJobSearch', () => {
  it('returns an empty string for missing values', () => {
    expect(normalizeJobSearch(null)).toBe('')
    expect(normalizeJobSearch(undefined)).toBe('')
    expect(normalizeJobSearch('   ')).toBe('')
  })

  it('trims surrounding whitespace but keeps inner spaces', () => {
    expect(normalizeJobSearch('  my job  ')).toBe('my job')
  })

  it('caps the value', () => {
    const long = 'a'.repeat(JOB_SEARCH_MAX_LENGTH + 10)
    expect(normalizeJobSearch(long)).toHaveLength(JOB_SEARCH_MAX_LENGTH)
  })
})

describe('jobMatchesSearch', () => {
  const job = makeJob('123456', 'Train-ResNet_v2', 'RUNNING')

  it('matches everything when the search is empty', () => {
    expect(jobMatchesSearch(job, '')).toBe(true)
    expect(jobMatchesSearch(job, '   ')).toBe(true)
  })

  it('matches part of the name, ignoring case', () => {
    expect(jobMatchesSearch(job, 'resnet')).toBe(true)
    expect(jobMatchesSearch(job, 'TRAIN')).toBe(true)
    expect(jobMatchesSearch(job, 'bert')).toBe(false)
  })

  it('matches part of the job ID', () => {
    expect(jobMatchesSearch(job, '3456')).toBe(true)
    expect(jobMatchesSearch(job, '999')).toBe(false)
  })

  it('requires every term to match, in the name or the ID', () => {
    expect(jobMatchesSearch(job, 'resnet 123')).toBe(true)
    expect(jobMatchesSearch(job, 'resnet bert')).toBe(false)
  })

  it('does not match across the name/ID boundary', () => {
    expect(jobMatchesSearch(job, 'v2123')).toBe(false)
  })
})

describe('getJobStatusGroup', () => {
  it('groups Slurm states', () => {
    expect(getJobStatusGroup('PENDING')).toBe('pending')
    expect(getJobStatusGroup('REQUEUED')).toBe('pending')
    expect(getJobStatusGroup('RUNNING')).toBe('running')
    expect(getJobStatusGroup('COMPLETING')).toBe('running')
    expect(getJobStatusGroup('SUSPENDED')).toBe('running')
    for (const state of ['FAILED', 'OUT_OF_MEMORY', 'NODE_FAIL', 'BOOT_FAIL']) {
      expect(getJobStatusGroup(state)).toBe('failed')
    }
    for (const state of ['COMPLETED', 'TIMEOUT', 'PREEMPTED', 'DEADLINE']) {
      expect(getJobStatusGroup(state)).toBe('finished')
    }
  })

  it('only looks at the first word of the state', () => {
    expect(getJobStatusGroup('CANCELLED by 12345')).toBe('finished')
    expect(getJobStatusGroup(' running ')).toBe('running')
  })

  it('groups PBS state codes', () => {
    expect(getJobStatusGroup('Q')).toBe('pending')
    expect(getJobStatusGroup('H')).toBe('pending')
    expect(getJobStatusGroup('R')).toBe('running')
    expect(getJobStatusGroup('F')).toBe('finished')
  })

  it('treats unknown or missing states as finished', () => {
    expect(getJobStatusGroup('SOMETHING_NEW')).toBe('finished')
    expect(getJobStatusGroup('')).toBe('finished')
    expect(getJobStatusGroup(undefined)).toBe('finished')
  })
})

describe('normalizeJobStatusFilter', () => {
  it('keeps known values', () => {
    for (const status of JOB_STATUS_FILTERS) {
      expect(normalizeJobStatusFilter(status)).toBe(status)
    }
  })

  it('returns null for missing or unknown values', () => {
    expect(normalizeJobStatusFilter(null)).toBeNull()
    expect(normalizeJobStatusFilter('')).toBeNull()
    expect(normalizeJobStatusFilter('RUNNING')).toBeNull()
    expect(normalizeJobStatusFilter('done')).toBeNull()
  })
})

describe('filterJobs', () => {
  const jobs = [
    makeJob('1', 'train', 'RUNNING'),
    makeJob('2', 'train', 'PENDING'),
    makeJob('3', 'eval', 'COMPLETED'),
    makeJob('4', 'train', 'CANCELLED by 42'),
    makeJob('5', 'train', 'FAILED'),
  ]
  const ids = (list: Job[]) => list.map((job) => job.jobId)

  it('returns every job without filters', () => {
    expect(ids(filterJobs(jobs, '', null))).toEqual(['1', '2', '3', '4', '5'])
  })

  it('filters by status group', () => {
    expect(ids(filterJobs(jobs, '', 'running'))).toEqual(['1'])
    expect(ids(filterJobs(jobs, '', 'pending'))).toEqual(['2'])
    expect(ids(filterJobs(jobs, '', 'failed'))).toEqual(['5'])
    expect(ids(filterJobs(jobs, '', 'finished'))).toEqual(['3', '4'])
  })

  it('combines search and status', () => {
    expect(ids(filterJobs(jobs, 'train', 'finished'))).toEqual(['4'])
    expect(ids(filterJobs(jobs, 'eval', 'running'))).toEqual([])
  })
})
