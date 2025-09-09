/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

export function nidStringToArray(str: string): string[] {
  const s = str.trim()

  // 1️⃣ Empty string → empty array
  if (s === '') {
    return []
  }

  // 2️⃣ Simple form: "nid" followed directly by digits
  const simpleMatch = /^nid(\d+)$/.exec(s)
  if (simpleMatch) {
    return [`nid${simpleMatch[1]}`]
  }

  // 3️⃣ Bracketed list: "nid[<comma-separated-ids>]"
  const listMatch = /^nid\[(.+?)\]$/.exec(s)
  if (listMatch) {
    return listMatch[1]
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
      .map((id) => `nid${id}`)
  }

  // If the format is not recognised we return an empty array.
  return []
}
