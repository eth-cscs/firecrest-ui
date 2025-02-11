import type { System } from '~/types/api-status'

export enum JobStateStatus {
  COMPLETED = 'COMPLETED',
  COMPLETING = 'COMPLETING',
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PREEMPTED = 'PREEMPTED',
  SUSPENDED = 'SUSPENDED',
  STOPPED = 'STOPPED',
  FAILED = 'FAILED',
}

export interface JobExitCode {
  status: string
  returnCode: number
}

export interface JobTime {
  elapsed: number
  start: number
  end: number
  suspended: number
  limit: number
}

export interface JobStatus {
  state: JobStateStatus
  stateReason: string
  exitCode: number
  interruptSignal: 0
}

export interface JobTask {
  id: string
  name: string
  status: JobStatus
  time: JobTime
}

export interface Job {
  jobId: number
  name: string
  status: JobStatus
  time: JobTime
  tasks: JobTask[]
  account: string
  allocationNodes: number
  cluster: string
  exitCode: JobExitCode
  group: string
  nodes: string
  partition: string
  priority: number
  killRequestUser: string
  user: string
  workingDirectory: string
}

export interface JobMetadata {
  jobId: number
  script: string | null
  standardInput: string | null
  standardOutput: string | null
  standardError: string | null
}

export interface SystemJob {
  system: System
  job: Job
}

export interface GetJobsResponse {
  jobs: Job[]
}

export interface GetJobResponse {
  jobs: Job[]
  error?: string
}

export interface GetJobMetadataResponse {
  jobs: JobMetadata[]
  error?: string
}

export interface GetSystemJobsResponse {
  system: System
  jobs: Job[]
  error?: string
}
