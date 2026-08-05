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
  // Maintenance mode: the real backend returns 503 with a flat `{"message": "..."}"` body. But
  // this branch also fires for ApiTarget.API_LOCAL calls - i.e. when the UI's own /api/* routes
  // proxy that same 503 back out, which they wrap via handleApiErrorResponse() into
  // `{"error": {"message": "...", "statusCode": 503}}` first (see response-helper.ts). Both
  // shapes have to be handled here, or the second hop falls back to dumping the raw JSON as the
  // message - matches getMaintenancePayloadMessage()'s same two-shape fallback.
  if (response.status === StatusCodes.SERVICE_UNAVAILABLE) {
    const text = await response.text()
    let message = text
    try {
      const parsed = JSON.parse(text)
      message = parsed?.message ?? parsed?.error?.message ?? text
    } catch {
      // not JSON, fall back to raw text
    }
    throw new Response(message, {
      status: StatusCodes.SERVICE_UNAVAILABLE,
      statusText: ReasonPhrases.SERVICE_UNAVAILABLE,
    })
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

// A thrown Response with status 503 is the app-wide signal for backend maintenance mode.
export function isMaintenanceResponse(error: unknown): error is Response {
  return error instanceof Response && error.status === StatusCodes.SERVICE_UNAVAILABLE
}

// Reads the maintenance message off a thrown Response. Safe to call even outside Remix's router
// (e.g. from a plain try/catch around a browser fetch), where `error.data` is never populated.
export async function getMaintenanceMessage(error: Response): Promise<string | null> {
  try {
    return await error.text()
  } catch {
    return null
  }
}

// Deferred loader data (defer()/<Await>) is streamed to the client via turbo-stream. Rejecting a
// deferred promise doesn't work as a maintenance signal: a raw Response can't be serialized across
// that boundary at all, and a plain Error fares no better - @remix-run/server-runtime's production
// build unconditionally replaces any rejected Error's message/stack with a generic "Unexpected
// Server Error" before it reaches the client (see single-fetch.js's encodeViaTurboStream, which
// runs sanitizeError() on every Error value). That sanitization doesn't happen in dev, so a
// message-tagged Error looks like it works locally and then breaks in every production build.
// Deferred call sites must instead catch isMaintenanceResponse() and *resolve* the promise with a
// flagged payload (see isMaintenancePayload() below) - only Error instances get sanitized, plain
// resolved values pass through untouched.

// Fetcher-backed resource routes have the same constraint from the other direction: a thrown
// Response would bubble to whatever route currently owns the fetcher, not a clean maintenance page
// (see api.status.$systemName.nodes.tsx), so they also return a flagged 200 payload instead of
// throwing. Two shapes can carry that flag: an explicit `{maintenance: true}` payload, or the
// `{error: {statusCode}}` shape already produced by helpers/response-helper.ts for routes that go
// through handleApiErrorResponse/handleFormErrorResponse.
export interface MaintenancePayload {
  maintenance: true
  message: string | null
}

export function isMaintenancePayload(data: any): boolean {
  if (!data) return false
  return data.maintenance === true || data?.error?.statusCode === StatusCodes.SERVICE_UNAVAILABLE
}

export function getMaintenancePayloadMessage(data: any): string | null {
  return data?.message ?? data?.error?.message ?? null
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
