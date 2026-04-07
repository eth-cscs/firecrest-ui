/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// types
import type { GetSystemNodesResponse, GetSystemsResponse, GetUserInfoResponse } from '~/types/api-status'
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

// Server-side TTL cache for getUserInfo. The data is user/system-specific but
// tolerates being slightly stale (groups change infrequently).
const USER_INFO_TTL_MS = 5 * 60 * 1000 // 5 minutes
const userInfoCache = new Map<string, { data: GetUserInfoResponse; expiresAt: number }>()

export const getSystemNodes = async (
  accessToken: string,
  systemName: string,
): Promise<GetSystemNodesResponse> => {
  const apiResponse = await api.get<GetSystemNodesResponse>(`/status/${systemName}/nodes`, {
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
  const now = Date.now()
  const cacheKey = `${systemName}:${accessToken}`
  const cached = userInfoCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return cached.data
  }
  // Evict expired entries when the cache grows large
  if (userInfoCache.size > 200) {
    for (const [key, entry] of userInfoCache) {
      if (entry.expiresAt <= now) userInfoCache.delete(key)
    }
  }
  const apiResponse = await api.get<GetUserInfoResponse>(`/status/${systemName}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  userInfoCache.set(cacheKey, { data: apiResponse, expiresAt: now + USER_INFO_TTL_MS })
  return apiResponse
}
