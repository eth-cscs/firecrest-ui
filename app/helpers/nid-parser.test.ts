/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { nidStringToArray } from '~/helpers/nid-parser'

describe('nidStringToArray (prefixed output)', () => {
  // ── Core examples ───────────────────────────────────────────────
  test('empty string → []', () => {
    expect(nidStringToArray('')).toEqual([])
  })

  test('"nid002538" → ["nid002538"]', () => {
    expect(nidStringToArray('nid002538')).toEqual(['nid002538'])
  })

  test('"nid[002538,002544]" → ["nid002538","nid002544"]', () => {
    expect(nidStringToArray('nid[002538,002544]')).toEqual(['nid002538', 'nid002544'])
  })

  // ── Useful edge cases ──────────────────────────────────────────
  test('trims surrounding whitespace', () => {
    expect(nidStringToArray('  nid[001, 002]  ')).toEqual(['nid001', 'nid002'])
  })

  test('single element inside brackets', () => {
    expect(nidStringToArray('nid[123456]')).toEqual(['nid123456'])
  })

  test('ignores empty entries from stray commas', () => {
    expect(nidStringToArray('nid[111,,222,]')).toEqual(['nid111', 'nid222'])
  })

  test('returns [] for unrecognized input', () => {
    expect(nidStringToArray('fooBar')).toEqual([])
  })

  // If your parser allows non-digit IDs inside brackets, they still get prefixed.
  // Keep or remove this depending on how strict you want validation to be.
  test('non-numeric items inside brackets are preserved (prefixed)', () => {
    expect(nidStringToArray('nid[abc,def]')).toEqual(['nidabc', 'niddef'])
  })
})
