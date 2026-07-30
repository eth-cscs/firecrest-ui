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
  // Maintenance mode: the backend returns 503 with a JSON `{"message": "..."}"` body regardless
  // of the requested response type. Detected here, before the API_LOCAL/API_REMOTE split, so it
  // behaves consistently for every caller (server-side loaders and direct browser fetches alike).
  if (response.status === StatusCodes.SERVICE_UNAVAILABLE) {
    const text = await response.text()
    let message = text
    try {
      message = JSON.parse(text)?.message ?? text
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

// Deferred loader data (defer()/<Await>) is streamed to the client via turbo-stream, which only
// knows how to serialize plain Error instances (see @remix-run/server-runtime's
// encodeViaTurboStream) - not a raw Response with a live body stream. Rejecting a deferred
// promise with the Response thrown by handleReponse() above crashes the SSR stream instead of
// reaching the ErrorBoundary. Deferred call sites must catch isMaintenanceResponse() and rethrow
// this instead.
//
// The marker lives in the message, not `.name`: turbo-stream's decode side
// (@remix-run/react/dist/single-fetch.js) only restores a custom `.name` when it happens to match
// an actual global Error subclass (TypeError, RangeError, ...) - anything else, including
// `.name = 'MaintenanceError'`, is silently dropped and reconstructed as a plain `Error`. `message`
// is the one field preserved verbatim across that boundary.
const MAINTENANCE_MESSAGE_PREFIX = '__MAINTENANCE__:'

export async function toMaintenanceError(error: Response): Promise<Error> {
  const message = await getMaintenanceMessage(error)
  return new Error(`${MAINTENANCE_MESSAGE_PREFIX}${message ?? ''}`)
}

export function isMaintenanceError(error: unknown): boolean {
  return (
    isMaintenanceResponse(error) ||
    (error instanceof Error && error.message.startsWith(MAINTENANCE_MESSAGE_PREFIX))
  )
}

// Strips the marker back off - use this instead of `error.message` when rendering a maintenance
// error produced by toMaintenanceError().
export function getMaintenanceErrorMessage(error: Error): string {
  return error.message.startsWith(MAINTENANCE_MESSAGE_PREFIX)
    ? error.message.slice(MAINTENANCE_MESSAGE_PREFIX.length)
    : error.message
}

// Same maintenance signal, but for fetcher-backed resource routes: those must never throw (a
// thrown Response would bubble to whatever route currently owns the fetcher, not a clean
// maintenance page - see api.status.$systemName.nodes.tsx), so they return a flagged 200 payload
// instead. Two shapes can carry that flag: an explicit `{maintenance: true}` payload, or the
// `{error: {statusCode}}` shape already produced by helpers/response-helper.ts for routes that go
// through handleApiErrorResponse/handleFormErrorResponse.
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
