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

// Marker used in a 503 body's `reason` field to signal *planned* maintenance (see
// templates/maintenance-service.yaml), as opposed to a real backend outage that also happens to
// return 503. Threaded through as the thrown Response's statusText, since that's the only part of
// a 503 body that survives both the route ErrorBoundary (isRouteErrorResponse) and the
// local-route wrapping in response-helper.ts.
export const MAINTENANCE_REASON = 'maintenance'

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
  // Any 503 might be planned maintenance (see templates/maintenance-service.yaml, which stubs the
  // backend with a flat `{"message": "...", "reason": "maintenance"}` body) or it might be a real
  // backend outage that also happens to return 503 - only the former should show the maintenance
  // page. This branch also fires for ApiTarget.API_LOCAL calls - i.e. when the UI's own /api/*
  // routes proxy that same 503 back out, which they wrap via handleApiErrorResponse() into
  // `{"error": {"message": "...", "statusCode": 503}}` first (see response-helper.ts). Both
  // shapes have to be handled here, or the second hop falls back to dumping the raw JSON as the
  // message - matches getMaintenancePayloadMessage()'s same two-shape fallback.
  if (response.status === StatusCodes.SERVICE_UNAVAILABLE) {
    const text = await response.text()
    let message = text
    let reason: string | undefined
    try {
      const parsed = JSON.parse(text)
      message = parsed?.message ?? parsed?.error?.message ?? text
      reason = parsed?.reason ?? parsed?.error?.reason
    } catch {
      // not JSON, fall back to raw text
    }
    throw new Response(message, {
      status: StatusCodes.SERVICE_UNAVAILABLE,
      statusText: reason === MAINTENANCE_REASON ? MAINTENANCE_REASON : ReasonPhrases.SERVICE_UNAVAILABLE,
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

// A thrown Response with status 503 and the maintenance statusText is the app-wide signal for
// planned backend maintenance. A 503 without it is a real outage - see the comment on
// MAINTENANCE_REASON.
export function isMaintenanceResponse(error: unknown): error is Response {
  return (
    error instanceof Response &&
    error.status === StatusCodes.SERVICE_UNAVAILABLE &&
    error.statusText === MAINTENANCE_REASON
  )
}

// Reads the maintenance message off a thrown Response. Safe to call even outside React Router's router
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
// that boundary at all, and a plain Error fares no better - react-router's production build
// unconditionally replaces any rejected Error's message/stack with a generic "Unexpected
// Server Error" before it reaches the client (see its encodeViaTurboStream, which runs
// sanitizeError() on every Error value). That sanitization doesn't happen in dev, so a
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
  reason: typeof MAINTENANCE_REASON
  message: string | null
}

// Only a `reason: "maintenance"` marker (or the equivalent on the wrapped `error` shape) counts
// as planned maintenance - a bare 503/error.statusCode of 503 alone is a real outage, not
// maintenance, and should fall through to normal error handling instead of the maintenance page.
export function isMaintenancePayload(data: any): boolean {
  if (!data) return false
  return data.reason === MAINTENANCE_REASON || data?.error?.reason === MAINTENANCE_REASON
}

export function getMaintenancePayloadMessage(data: any): string | null {
  return data?.message ?? data?.error?.message ?? null
}

// X-Correlation-ID identifies the whole browser-originated request end-to-end and is
// forwarded unchanged (minted once in server.js). X-Request-ID identifies this single
// hop; callers that need to log the exact value used (see logInfoHttp's requestId
// param) can pass one in, otherwise a fresh one is minted here - either way each call
// gets its own, so concurrent/fan-out calls from the same page load don't share one id.
// Deliberately no logging in this function: this file is bundled for the client too
// (e.g. ErrorView.tsx imports MAINTENANCE_REASON from it), so it can't import the
// server-only logger - see server.js's fetch wrapper for where these calls get logged.
export function withTracingHeaders(
  headers: Record<string, string>,
  request: Request | null | undefined,
  requestId: string = crypto.randomUUID(),
): Record<string, string> {
  const correlationId = request?.headers?.get('x-correlation-id') ?? undefined
  return {
    ...headers,
    ...(correlationId ? { 'X-Correlation-ID': correlationId } : {}),
    'X-Request-ID': requestId,
  }
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
