/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

function formatArray(values: string[], lang: 'bash' | 'python' = 'bash'): string {
  if (!Array.isArray(values) || values.length === 0) {
    return lang === 'python' ? '[]' : '()'
  }

  switch (lang) {
    case 'python':
      // Example:
      // [
      //   "https://example.com/part1",
      //   "https://example.com/part2"
      // ]
      return `[\n${values.map((v) => `  "${v}"`).join(',\n')}\n]`

    case 'bash':
    default:
      // Example:
      // (
      //   "https://example.com/part1"
      //   "https://example.com/part2"
      // )
      return `(\n${values.map((v) => `  "${v}"`).join('\n')}\n)`
  }
}
export { formatArray }
