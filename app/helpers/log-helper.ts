/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// logger
import logger from '~/logger/logger.server'
import { LogActionMessage } from '~/helpers/log-labels'

// requestId: the exact X-Request-ID used for the single backend call this action log
// line reports on (caller generates it and passes the same value into the api.ts
// function, since withTracingHeaders() doesn't expose it back). Only meaningful for
// single-call action events - page-view loaders can fan out into several backend calls
// with their own distinct ids, so there's no one value to log there; those rely on
// firecrest.correlationId alone.
const logInfoHttp = ({ eventAction, request, requestId, extraInfo }: any) => {
  const { username, system, account, jobId, ...rest } = extraInfo || {}
  logger.info({
    message: LogActionMessage[eventAction] ?? eventAction,
    'event.action': eventAction.includes(' ') ? 'page.view' : eventAction,
    'request.id': requestId ?? undefined,
    'firecrest.correlationId': request?.headers?.get('x-correlation-id') ?? undefined,
    'user.id': username ?? undefined,
    'firecrest.username': username ?? undefined,
    'http.request.method': request?.method ?? undefined,
    'url.path': request?.url ? new URL(request.url).pathname : undefined,
    'firecrest.system': system ?? undefined,
    'firecrest.account': account ?? undefined,
    'firecrest.jobId': jobId ?? undefined,
    ...rest,
  })
}

export { logInfoHttp }
