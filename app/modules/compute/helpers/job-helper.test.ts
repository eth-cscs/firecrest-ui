/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import {
  normalizeJobNameFilter,
  JOB_NAME_FILTER_MAX_LENGTH,
} from '~/modules/compute/helpers/job-helper'

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
