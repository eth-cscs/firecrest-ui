/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

export type JobDescritpion = {
  script?: string
  script_path?: string
  account?: string
  name?: string
  working_directory: string
  standard_input?: string
  standard_output?: string
  standard_error?: string
  environment?: Record<string, string>
  reservation?: string
  partition?: string
}

export type PostJobPayload = {
  job: JobDescritpion
}

export type PostJobResponse = {
  jobId: number
}

// Form
export type PostJobFormPayload = {
  scriptMode: 'local' | 'remote'
  file?: any
  remoteScript?: string
  account?: string
  name?: string
  workingDirectory: string
  standardInput?: string
  standardOutput?: string
  standardError?: string
  environment?: string
  reservation?: string
  partition?: string
}

export const convertPostJobFormToApiPayload = async (
  payload: PostJobFormPayload,
): Promise<PostJobPayload> => {
  const isRemote = payload.scriptMode === 'remote'
  const script = isRemote ? undefined : await payload.file.text()
  return {
    job: {
      script: script,
      script_path: isRemote ? payload.remoteScript : undefined,
      working_directory: payload.workingDirectory,
      account: payload.account,
      name: payload.name
        ? payload.name
        : isRemote
          ? payload.remoteScript?.split('/').pop()
          : payload.file.name,
      standard_input: payload.standardInput,
      standard_output: payload.standardOutput,
      standard_error: payload.standardError,
      environment: payload.environment ? JSON.parse(payload.environment) : undefined,
      reservation: payload.reservation || undefined,
      partition: payload.partition || undefined,
    },
  }
}
