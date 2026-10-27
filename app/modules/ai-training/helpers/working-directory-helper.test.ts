/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import {
  getDefaultTrainingWorkingDirectory,
  isOnHomeFileSystem,
} from '~/modules/ai-training/helpers/working-directory-helper'
import { FileSystemDataType, ServiceType, System } from '~/types/api-status'
import type { FileSystem } from '~/types/api-status'

const HOME: FileSystem = {
  path: '/users',
  dataType: FileSystemDataType.users,
  defaultWorkDir: true,
}
const SCRATCH: FileSystem = {
  path: '/capstor/scratch/cscs',
  dataType: FileSystemDataType.scratch,
  defaultWorkDir: false,
}
const STORE: FileSystem = {
  path: '/capstor/store/cscs',
  dataType: FileSystemDataType.store,
  defaultWorkDir: false,
}

const buildSystem = (fileSystems: FileSystem[], unhealthyPaths: string[] = []): System =>
  ({
    name: 'test-system',
    probing: { services: { filesystems: { timeout: 5 } }, interval_check: 60 },
    fileSystems,
    servicesHealth: fileSystems.map((fileSystem: FileSystem) => ({
      serviceType: ServiceType.filesystem,
      lastChecked: '',
      latency: 0,
      healthy: !unhealthyPaths.includes(fileSystem.path),
      message: null,
      path: fileSystem.path,
    })),
  }) as unknown as System

describe('getDefaultTrainingWorkingDirectory', () => {
  it('prefers the user directory on scratch over the default filesystem', () => {
    expect(getDefaultTrainingWorkingDirectory(buildSystem([HOME, SCRATCH]), 'alice')).toBe(
      '/capstor/scratch/cscs/alice',
    )
  })

  it('skips an unhealthy scratch when another one is healthy', () => {
    const otherScratch = { ...SCRATCH, path: '/iopsstor/scratch/cscs' }
    const system = buildSystem([HOME, SCRATCH, otherScratch], [SCRATCH.path])
    expect(getDefaultTrainingWorkingDirectory(system, 'alice')).toBe('/iopsstor/scratch/cscs/alice')
  })

  it('falls back to the default filesystem without scratch', () => {
    expect(getDefaultTrainingWorkingDirectory(buildSystem([STORE, HOME]), 'alice')).toBe(
      '/users/alice',
    )
    expect(getDefaultTrainingWorkingDirectory(null, 'alice')).toBe('')
  })
})

describe('isOnHomeFileSystem', () => {
  const system = buildSystem([HOME, SCRATCH])

  it('detects paths on the home filesystem', () => {
    expect(isOnHomeFileSystem(system, '/users/alice')).toBe(true)
    expect(isOnHomeFileSystem(system, '/users/alice/runs ')).toBe(true)
    expect(isOnHomeFileSystem(system, '/users')).toBe(true)
  })

  it('accepts other filesystems and paths that only share a prefix', () => {
    expect(isOnHomeFileSystem(system, '/capstor/scratch/cscs/alice')).toBe(false)
    expect(isOnHomeFileSystem(system, '/users2/alice')).toBe(false)
    expect(isOnHomeFileSystem(null, '/users/alice')).toBe(false)
  })
})
