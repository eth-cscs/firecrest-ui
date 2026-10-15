/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { getDefaultFileSystemFromSystem } from '~/modules/status/helpers/system-helper'
import { FileSystemDataType, ServiceType, System } from '~/types/api-status'

const buildSystem = (overrides: Partial<System> = {}): System =>
  ({
    name: 'test-system',
    ssh: {} as any,
    scheduler: {} as any,
    probing: { services: { filesystems: { timeout: 5 } }, interval_check: 60 },
    fileSystems: [
      { path: '/mnt/fs-default/scratch', dataType: FileSystemDataType.scratch, defaultWorkDir: true },
      { path: '/mnt/fs-secondary/scratch', dataType: FileSystemDataType.scratch, defaultWorkDir: false },
    ],
    servicesHealth: [
      {
        serviceType: ServiceType.filesystem,
        lastChecked: '',
        latency: 0,
        healthy: false,
        message: null,
        path: '/mnt/fs-default/scratch',
      },
      {
        serviceType: ServiceType.filesystem,
        lastChecked: '',
        latency: 0,
        healthy: true,
        message: null,
        path: '/mnt/fs-secondary/scratch',
      },
    ],
    ...overrides,
  }) as System

describe('getDefaultFileSystemFromSystem', () => {
  test('skips the flagged default filesystem when it is unhealthy, picks a healthy one instead', () => {
    const fileSystem = getDefaultFileSystemFromSystem(buildSystem())
    expect(fileSystem?.path).toBe('/mnt/fs-secondary/scratch')
  })

  test('still picks the flagged default filesystem when it is healthy', () => {
    const system = buildSystem({
      servicesHealth: [
        {
          serviceType: ServiceType.filesystem,
          lastChecked: '',
          latency: 0,
          healthy: true,
          message: null,
          path: '/mnt/fs-default/scratch',
        },
        {
          serviceType: ServiceType.filesystem,
          lastChecked: '',
          latency: 0,
          healthy: true,
          message: null,
          path: '/mnt/fs-secondary/scratch',
        },
      ],
    })
    const fileSystem = getDefaultFileSystemFromSystem(system)
    expect(fileSystem?.path).toBe('/mnt/fs-default/scratch')
  })

  test('falls back to the flagged default filesystem when none are healthy', () => {
    const system = buildSystem({
      servicesHealth: [
        {
          serviceType: ServiceType.filesystem,
          lastChecked: '',
          latency: 0,
          healthy: false,
          message: null,
          path: '/mnt/fs-default/scratch',
        },
        {
          serviceType: ServiceType.filesystem,
          lastChecked: '',
          latency: 0,
          healthy: false,
          message: null,
          path: '/mnt/fs-secondary/scratch',
        },
      ],
    })
    const fileSystem = getDefaultFileSystemFromSystem(system)
    expect(fileSystem?.path).toBe('/mnt/fs-default/scratch')
  })

  test('health checking is skipped when filesystem probing is not configured', () => {
    const system = buildSystem({ probing: { services: null, interval_check: 60 } })
    const fileSystem = getDefaultFileSystemFromSystem(system)
    expect(fileSystem?.path).toBe('/mnt/fs-default/scratch')
  })

  test('returns null for a system with no filesystems', () => {
    const system = buildSystem({ fileSystems: [] })
    expect(getDefaultFileSystemFromSystem(system)).toBeNull()
  })
})
