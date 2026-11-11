/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import {
  normalizeJobNameFilter,
  normalizeJobTimeWindow,
  getJobTimeWindowStart,
  JOB_NAME_FILTER_MAX_LENGTH,
  JOB_TIME_WINDOWS,
  DEFAULT_JOB_TIME_WINDOW,
} from '~/modules/compute/helpers/job-helper'

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

describe('normalizeJobNameFilter', () => {
  it('returns an empty string for missing values', () => {
    expect(normalizeJobNameFilter(null)).toBe('')
    expect(normalizeJobNameFilter(undefined)).toBe('')
    expect(normalizeJobNameFilter('   ')).toBe('')
  })

  it('trims surrounding whitespace but keeps inner spaces', () => {
    expect(normalizeJobNameFilter('  my job  ')).toBe('my job')
  })

  it('caps the value at the backend limit', () => {
    const long = 'a'.repeat(JOB_NAME_FILTER_MAX_LENGTH + 10)
    expect(normalizeJobNameFilter(long)).toHaveLength(JOB_NAME_FILTER_MAX_LENGTH)
  })
})
