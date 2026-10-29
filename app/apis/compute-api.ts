/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { PostJobPayload, PostJobResponse } from '~/types/api-compute'
import type {
  GetSystemJobsResponse,
  GetJobsResponse,
  GetJobResponse,
  GetJobMetadataResponse,
} from '~/types/api-job'

// apis
import api, { ApiTarget, isMaintenanceResponse, withTracingHeaders } from './api'

export const getJobs = async (
  accessToken: string,
  system: string = '',
  account: string = '',
  allUsers: boolean = false,
  name: string = '',
  request: Request | null = null,
): Promise<GetSystemJobsResponse> => {
  try {
    const query = new URLSearchParams({ account: account, allusers: String(allUsers) })
    // Backend-side filter: matches the full job name exactly (it's passed to the scheduler as-is).
    if (name) {
      query.set('name', name)
    }
    const apiResponse = await api.get<GetJobsResponse>(
      `/compute/${system}/jobs?${query.toString()}`,
      {
        headers: withTracingHeaders({ Authorization: `Bearer ${accessToken}` }, request),
      },
    )
    return {
      system: system,
      jobs: apiResponse.jobs ? apiResponse.jobs : [],
      account: account,
      allUsers: allUsers,
      name: name,
      error: undefined,
    }
  } catch (api_error: unknown) {
    if (isMaintenanceResponse(api_error)) {
      throw api_error
    }
    let message = 'Unable to fetch jobs.'
    if (api_error instanceof Error) {
      message += ' ' + api_error.message
    }
    return {
      system: system,
      jobs: [],
      account: account,
      allUsers: allUsers,
      name: name,
      error: { message },
    }
  }
}

export const getJob = async (
  accessToken: string,
  systemName: string,
  jobId: string,
  request: Request | null = null,
): Promise<GetJobResponse> => {
  try {
    const apiResponse = await api.get<GetJobResponse>(`/compute/${systemName}/jobs/${jobId}`, {
      headers: withTracingHeaders({ Authorization: `Bearer ${accessToken}` }, request),
    })
    return { jobs: apiResponse.jobs, error: undefined }
  } catch (error) {
    if (isMaintenanceResponse(error)) {
      throw error
    }
    return { jobs: [], error: `Unable to fetch job (job id <${jobId}>)` }
  }
}

export const getJobMetadata = async (
  accessToken: string,
  systemName: string,
  jobId: string,
  request: Request | null = null,
): Promise<GetJobMetadataResponse> => {
  try {
    const apiResponse = await api.get<GetJobMetadataResponse>(
      `/compute/${systemName}/jobs/${jobId}/metadata`,
      {
        headers: withTracingHeaders({ Authorization: `Bearer ${accessToken}` }, request),
      },
    )
    return { jobs: apiResponse.jobs, error: undefined }
  } catch (error) {
    if (isMaintenanceResponse(error)) {
      throw error
    }
    return { jobs: [], error: `Unable to fetch job metadata (job id <${jobId}>)` }
  }
}

export const cancelJob = async (
  accessToken: string,
  systemName: string,
  jobId: string,
  request: Request | null = null,
): Promise<any> => {
  await api.delete<any, any>(`/compute/${systemName}/jobs/${jobId}`, null, {
    headers: withTracingHeaders({ Authorization: `Bearer ${accessToken}` }, request),
  })
}

export const postJob = async (
  accessToken: string,
  systemName: string,
  jobPayload: PostJobPayload,
  request: Request | null = null,
  requestId?: string,
): Promise<PostJobResponse> => {
  const apiResponse = await api.post<any, PostJobResponse>(
    `/compute/${systemName}/jobs`,
    JSON.stringify(jobPayload),
    {
      headers: withTracingHeaders(
        { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        request,
        requestId,
      ),
    },
  )
  return apiResponse
}

// Local apis

export const getLocalJob = async (systemName: string, jobId: string | number): Promise<GetJobResponse> => {
  const apiResponse = await api.get<GetJobResponse>(
    `/api/compute/systems/${systemName}/jobs/${jobId}`,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}

export const getLocalJobs = async (
  systemName: string,
  account: string,
  allUsers: boolean = false,
): Promise<GetSystemJobsResponse> => {
  const apiResponse = await api.get<GetSystemJobsResponse>(
    `/api/compute/systems/${systemName}/accounts/${account}/jobs?allUsers=${allUsers}`,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}
