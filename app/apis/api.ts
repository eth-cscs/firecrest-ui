/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { ReasonPhrases, StatusCodes, getReasonPhrase } from 'http-status-codes'
// configs
import firecrest from '~/configs/firecrest.config'

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
  const response = await fetch(buildUrl(url, target), config)
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
