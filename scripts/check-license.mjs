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

// Normalize line endings to \n
const normalize = (s) => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
const expectedHeader = headerLines.join('\n')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

// Simple recursive walker
function* walk(dir) {
  const ents = fs.readdirSync(dir, { withFileTypes: true })
  for (const ent of ents) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      yield* walk(full)
    } else {
      yield full
    }
  }
}

// Collect files to check
let inputs = process.argv.slice(2)

// If no args, default to all TS/TSX under app/
if (inputs.length === 0) {
  const appDir = path.join(repoRoot, 'app')
  if (fs.existsSync(appDir)) {
    for (const file of walk(appDir)) {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        inputs.push(file)
      }
    }
  }
  // If still nothing, show usage and exit
  if (inputs.length === 0) {
    console.error(
      'Usage: node scripts/check-license.mjs <files...>\n' +
        'Or run with no args to scan app/**/*.ts{,x}',
    )
    process.exit(1)
  }
}

let failed = false

for (const file of inputs) {
  // Skip anything that doesn't exist
  if (!fs.existsSync(file)) continue
  // Only check text-like files
  if (!/\.(t|j)sx?$/.test(file)) continue

  const raw = fs.readFileSync(file, 'utf8')
  // Strip BOM and normalize line endings
  const content = normalize(raw.replace(/^\uFEFF/, ''))

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
