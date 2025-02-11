/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// TODO: move FileSystemDataType type to the filesystem-api.ts file
export enum FileSystemDataType {
  users = 'users',
  store = 'store',
  archive = 'archive',
  apps = 'apps',
  scratch = 'scratch',
}

export enum SchedulerType {
  slurm = 'slurm',
}

export enum ServiceType {
  scheduler = 'scheduler',
  ssh = 'ssh',
  filesystem = 'filesystem',
}

export enum SystemHealtyStatus {
  healthy = 'healthy',
  degraded = 'degraded',
  unhealthy = 'unhealthy',
}

export interface SshTimeout {
  connection: number
  login: number
  commandExecution: number
}

export interface Ssh {
  host: string
  port: string
  certEmbeddedCmd: boolean
  timeout: SshTimeout
}

export interface Scheduler {
  type: string
  version: string
  apiUrl: string
}

// TODO: move FileSystem type to the filesystem-api.ts file
export interface FileSystem {
  path: string
  dataType: FileSystemDataType
  defaultWorkDir: boolean
}

export interface SystemNodesHealth {
  available: number
  total: number
}

export interface ServiceHealth {
  serviceType: ServiceType
  lastChecked: string
  latency: number
  healthy: boolean
  message: string | null
  nodes?: SystemNodesHealth
  path?: string
}

export interface SystemProbing {
  interval: number
  timeout: number
  healthyLatency: number
  healthyLoad: number
}

export interface SystemTimeouts {
  sshConnection: number
  sshLogin: number
  sshCommandExecution: number
}

export interface System {
  name: string
  ssh: Ssh
  scheduler: Scheduler
  servicesHealth: ServiceHealth[]
  probing: SystemProbing
  fileSystems: FileSystem[]
  datatransferJobsDirectives?: string[]
  timeouts?: SystemTimeouts
}

export interface GetSystemsResponse {
  systems: System[]
}

export interface FileSystemModel {
  description: string
  name: string
  path: string
  status: string
  statusCode: number
}

export type GetStatusFilesystemResponse = {
  [key: string]: FileSystemModel[]
}
