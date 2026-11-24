/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import {
  isSystemHealthy,
  isSystemHealthyByServiceType,
  isFileSystemHealthy,
} from '~/helpers/system-helper'
import {
  FileSystemDataType,
  ServiceType,
  SystemHealtyStatus,
  type ServiceHealth,
  type System,
} from '~/types/api-status'

const health = (serviceType: ServiceType, healthy: boolean, path?: string): ServiceHealth =>
  ({
    serviceType,
    lastChecked: '',
    latency: 0,
    healthy,
    message: null,
    ...(path ? { path } : {}),
  }) as ServiceHealth

const buildSystem = (servicesHealth: ServiceHealth[] | null): System =>
  ({
    name: 'test-system',
    ssh: {} as any,
    scheduler: {} as any,
    probing: { services: { filesystems: { timeout: 5 } }, interval_check: 60 },
    fileSystems: [{ path: '/scratch', dataType: FileSystemDataType.scratch, defaultWorkDir: true }],
    servicesHealth,
  }) as System

describe('isSystemHealthy', () => {
  it('is healthy when every service is healthy', () => {
    const system = buildSystem([
      health(ServiceType.scheduler, true),
      health(ServiceType.filesystem, true, '/scratch'),
    ])
    expect(isSystemHealthy(system)).toBe(SystemHealtyStatus.healthy)
  })

  it('is degraded when only some services are healthy', () => {
    const system = buildSystem([
      health(ServiceType.scheduler, true),
      health(ServiceType.filesystem, false, '/scratch'),
    ])
    expect(isSystemHealthy(system)).toBe(SystemHealtyStatus.degraded)
  })

  it('is unhealthy when no service is healthy', () => {
    const system = buildSystem([health(ServiceType.scheduler, false)])
    expect(isSystemHealthy(system)).toBe(SystemHealtyStatus.unhealthy)
  })

  it('is unknown, not a crash, before the backend has run its first health check', () => {
    expect(isSystemHealthy(buildSystem(null))).toBe(SystemHealtyStatus.unknown)
  })
})

describe('null servicesHealth in the per-service helpers', () => {
  const system = buildSystem(null)

  it('reports the scheduler as not (yet) healthy', () => {
    expect(isSystemHealthyByServiceType(system, ServiceType.scheduler)).toBe(false)
  })

  it('reports a filesystem as not (yet) healthy', () => {
    expect(isFileSystemHealthy(system, system.fileSystems[0])).toBe(false)
  })
})
