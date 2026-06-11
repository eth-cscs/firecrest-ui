/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { ReasonPhrases, StatusCodes, getReasonPhrase } from 'http-status-codes'
// configs
import firecrest from '~/configs/firecrest.config'
// logger
import logger from '~/logger/logger.server'

export enum ApiTarget {
  API_LOCAL = 0,
  API_REMOTE = 1,
}

export enum ResponseBodyType {
  JSON,
  BLOB,
}

const buildUrl = (url: string, target: ApiTarget = ApiTarget.API_REMOTE) => {
  if (target === ApiTarget.API_REMOTE) {
    return `${firecrest.baseUrl}${url}`
  }
  return `${url}`
}

async function request<TResponse>(
  url: string,
  target: ApiTarget,
  config: RequestInit = {},
  jsonResponse: ResponseBodyType = ResponseBodyType.JSON,
): Promise<TResponse> {
  const t = performance.now()
  const response = await fetch(buildUrl(url, target), config)
  const durationMs = Math.round(performance.now() - t)
  const fields = {
    'event.action': 'api.request',
    'event.duration': durationMs * 1_000_000,
    'url.path': url,
    'http.response.status_code': response.status,
    component: 'firecrest',
  }
  if (durationMs > 2_000) {
    logger.warn(fields, `Slow api.request: ${url} ${durationMs}ms`)
  } else {
    logger.debug(fields, `api.request`)
  }
  return await handleReponse(response, target, jsonResponse)
}

async function handleReponse(
  response: any,
  target: ApiTarget,
  jsonResponse: ResponseBodyType = ResponseBodyType.JSON,
) {
  let httpResponse = null
  if (response.status == StatusCodes.NO_CONTENT && response.ok) {
    return httpResponse
  }
  switch (jsonResponse) {
    case ResponseBodyType.JSON:
      httpResponse = await response.json()
      break
    case ResponseBodyType.BLOB:
      httpResponse = await response.blob()
      break
  }
  if (response.ok) {
    return httpResponse
  }
  if (target === ApiTarget.API_LOCAL) {
    throw httpResponse
  }
  let statusText = ReasonPhrases.INTERNAL_SERVER_ERROR.toString()
  if (Object.values(StatusCodes).includes(response.status)) {
    statusText = getReasonPhrase(response.status).toString()
  }
  throw new Response(httpResponse.message, {
    status: response.status,
    statusText: statusText,
  })
}

export function withRequestId(
  headers: Record<string, string>,
  request: Request | null | undefined,
): Record<string, string> {
  const id = request?.headers?.get('x-request-id')
  return id ? { ...headers, 'X-Request-ID': id } : headers
}

const api = {
  url: (url: string) => buildUrl(url),
  get: <TResponse>(
    url: string,
    config: RequestInit = {},
    target: ApiTarget = ApiTarget.API_REMOTE,
    jsonResponse: ResponseBodyType = ResponseBodyType.JSON,
  ) => {
    return request<TResponse>(url, target, config, jsonResponse)
  },
  post: <TBody extends BodyInit, TResponse>(
    url: string,
    body: TBody,
    config: RequestInit = {},
    target: ApiTarget = ApiTarget.API_REMOTE,
    jsonResponse: ResponseBodyType = ResponseBodyType.JSON,
  ) => request<TResponse>(url, target, { ...config, ...{ method: 'POST', body } }, jsonResponse),
  put: <TBody extends BodyInit, TResponse>(
    url: string,
    body: TBody,
    config: RequestInit = {},
    target: ApiTarget = ApiTarget.API_REMOTE,
  ) => request<TResponse>(url, target, { ...config, ...{ method: 'PUT', body } }),
  patch: <TBody extends BodyInit, TResponse>(
    url: string,
    body: TBody,
    config: RequestInit = {},
    target: ApiTarget = ApiTarget.API_REMOTE,
  ) => request<TResponse>(url, target, { ...config, ...{ method: 'PATCH', body } }),
  delete: <TBody extends BodyInit, TResponse>(
    url: string,
    body: TBody,
    config: RequestInit = {},
    target: ApiTarget = ApiTarget.API_REMOTE,
  ) => request<TResponse>(url, target, { ...config, ...{ method: 'DELETE', body } }),
}

export default api
