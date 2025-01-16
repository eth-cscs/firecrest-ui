// types
import type { GetSystemsResponse } from '~/types/api-status'
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
