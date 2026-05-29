/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// logger
import logger from '~/logger/logger.server'
import { LogActionMessage } from '~/helpers/log-labels'

const logInfoHttp = ({ eventAction, request, extraInfo }: any) => {
  const { username, system, account, jobId, ...rest } = extraInfo || {}
  logger.info({
    message: LogActionMessage[eventAction] ?? eventAction,
    'event.action': eventAction.includes(' ') ? 'page.view' : eventAction,
    'request.id': request?.headers?.get('x-request-id') ?? undefined,
    'user.id': username ?? undefined,
    'http.request.method': request?.method ?? undefined,
    'url.path': request?.url ? new URL(request.url).pathname : undefined,
    'firecrest.system': system ?? undefined,
    'firecrest.account': account ?? undefined,
    'firecrest.jobId': jobId ?? undefined,
    ...rest,
  })
}

export { logInfoHttp }
