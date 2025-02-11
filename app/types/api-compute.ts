/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

export type JobDescritpion = {
  script: string
  name?: string
  working_directory: string
  standard_input?: string
  standard_output?: string
  standard_error?: string
  environment?: Record<string, string>
}

export type PostJobPayload = {
  job: JobDescritpion
}

export type PostJobResponse = {
  jobId: number
}

// Form
export type PostJobFormPayload = {
  system: string
  file: any
  name?: string
  workingDirectory: string
  standardInput?: string
  standardOutput?: string
  standardError?: string
  environment?: string
}

export const convertPostJobFormToApiPayload = async (
  payload: PostJobFormPayload,
): Promise<PostJobPayload> => {
  const script = await payload.file.text()
  return {
    job: {
      script: script,
      working_directory: payload.workingDirectory,
      name: payload.name ? payload.name : payload.file.name,
      standard_input: payload.standardInput,
      standard_output: payload.standardOutput,
      standard_error: payload.standardError,
      environment: payload.environment ? JSON.parse(payload.environment) : undefined,
    },
  }
}
