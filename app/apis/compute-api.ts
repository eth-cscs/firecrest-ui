/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { System } from '~/types/api-status'
import type { PostJobPayload, PostJobResponse } from '~/types/api-compute'
import type {
  GetSystemJobsResponse,
  GetJobsResponse,
  GetJobResponse,
  GetJobMetadataResponse,
} from '~/types/api-job'

// apis
import api, { ApiTarget } from './api'

export const getJobs = async (
  accessToken: string,
  system: System,
  request: Request | null = null,
): Promise<GetSystemJobsResponse> => {
  try {
    const apiResponse = await api.get<GetJobsResponse>(`/compute/${system.name}/jobs`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    return { system: system, jobs: apiResponse.jobs, error: undefined }
  } catch (error) {
    return { system: system, jobs: [], error: 'unable to fetch jobs' }
  }
}

export const getJob = async (
  accessToken: string,
  systemName: string,
  jobId: number,
  request: Request | null = null,
): Promise<GetJobResponse> => {
  try {
    const apiResponse = await api.get<GetJobResponse>(`/compute/${systemName}/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    return { jobs: apiResponse.jobs, error: undefined }
  } catch (error) {
    return { jobs: [], error: `Unable to fetch job (job id <${jobId}>)` }
  }
}

export const getJobMetadata = async (
  accessToken: string,
  systemName: string,
  jobId: number,
  request: Request | null = null,
): Promise<GetJobMetadataResponse> => {
  try {
    const apiResponse = await api.get<GetJobMetadataResponse>(
      `/compute/${systemName}/jobs/${jobId}/metadata`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
    return { jobs: apiResponse.jobs, error: undefined }
  } catch (error) {
    return { jobs: [], error: `Unable to fetch job metadata (job id <${jobId}>)` }
  }
}

export const cancelJob = async (
  accessToken: string,
  systemName: string,
  jobId: number,
  request: Request | null = null,
): Promise<any> => {
  await api.delete<any, any>(`/compute/${systemName}/jobs/${jobId}`, null, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export const postJob = async (
  accessToken: string,
  systemName: string,
  jobPayload: PostJobPayload,
  request: Request | null = null,
): Promise<PostJobResponse> => {
  const apiResponse = await api.post<any, PostJobResponse>(
    `/compute/${systemName}/jobs`,
    JSON.stringify(jobPayload),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )
  return apiResponse
}

// Local apis

export const getLocalJob = async (systemName: string, jobId: number): Promise<GetJobResponse> => {
  const apiResponse = await api.get<GetJobResponse>(
    `/api/compute/systems/${systemName}/jobs/${jobId}`,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}
