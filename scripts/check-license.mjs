import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const headerLines = [
  '/*************************************************************************',
  ' Copyright (c) 2025, ETH Zurich. All rights reserved.',
  '',
  '  Please, refer to the LICENSE file in the root directory.',
  '  SPDX-License-Identifier: BSD-3-Clause',
  '*************************************************************************/',
]

// Normalize line endings and indentation
const expectedHeader = headerLines.join('\n')

const [, , ...fileGlobs] = process.argv

if (fileGlobs.length === 0) {
  console.error('Usage: node scripts/check-license.mjs <files>')
  process.exit(1)
}

let failed = false

for (const file of fileGlobs) {
  if (!fs.existsSync(file)) continue

  const content = fs.readFileSync(file, 'utf8')
  if (!content.startsWith(expectedHeader)) {
    console.error(`❌ Missing or incorrect license header: ${file}`)
    failed = true
  }
}

if (failed) {
  process.exit(1)
} else {
  console.log('✅ All headers OK.')
}
