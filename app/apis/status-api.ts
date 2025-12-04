/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// types
import type { GetSystemsResponse, GetUserInfoResponse } from '~/types/api-status'
// apis
import api from './api'

export const getSystems = async (
  accessToken: string,
  request: Request | null = null,
): Promise<GetSystemsResponse> => {
  const apiResponse = await api.get<GetSystemsResponse>('/status/systems', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  return apiResponse
}

export const getUserInfo = async (
  accessToken: string,
  systemName: string,
  request: Request | null = null,
): Promise<GetUserInfoResponse> => {
  const apiResponse = await api.get<GetUserInfoResponse>(`/status/${systemName}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  return apiResponse
}
