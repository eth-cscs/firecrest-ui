/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// Thin server-only wrappers around status-api that add ECS timing logs.
// status-api.ts itself cannot import logger.server (no .server suffix →
// included in the client bundle). This file carries the .server suffix
// so Vite excludes it from the client bundle.

import logger from '~/logger/logger.server'
import { getSystems as _getSystems, getSystemNodes as _getSystemNodes } from './status-api'
import type { GetSystemsResponse, GetSystemNodesResponse } from '~/types/api-status'

function logCall(urlPath: string, startMs: number) {
  const durationMs = Math.round(performance.now() - startMs)
  const fields = {
    'event.action': 'api.request',
    'event.duration': durationMs * 1_000_000,
    'url.path': urlPath,
    component: 'firecrest',
  }
  if (durationMs > 2_000) {
    logger.warn(fields, `Slow api.request: ${urlPath} ${durationMs}ms`)
  } else {
    logger.debug(fields, 'api.request')
  }
}

export const getSystems = async (
  accessToken: string,
  request: Request | null = null,
): Promise<GetSystemsResponse> => {
  const t = performance.now()
  const result = await _getSystems(accessToken, request)
  logCall('/status/systems', t)
  return result
}

export const getSystemNodes = async (
  accessToken: string,
  systemName: string,
  request: Request | null = null,
): Promise<GetSystemNodesResponse> => {
  logger.debug(
    { 'event.action': 'api.request.start', 'url.path': `/status/${systemName}/nodes`, component: 'firecrest' },
    `api.request.start: /status/${systemName}/nodes`,
  )
  const t = performance.now()
  const result = await _getSystemNodes(accessToken, systemName, request)
  logCall(`/status/${systemName}/nodes`, t)
  return result
}
