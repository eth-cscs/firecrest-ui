/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// logger
import logger from '~/logger/logger.server'

const logInfoHttp = ({ message, request, extraInfo }: any) => {
  const { username, ...rest } = extraInfo || {}
  logger.info({
    message,
    'request.id': request?.headers?.get('x-request-id') ?? undefined,
    'user.id': username ?? undefined,
    'http.request.method': request?.method ?? undefined,
    'url.path': request?.url ? new URL(request.url).pathname : undefined,
    ...rest,
  })
}

export { logInfoHttp }
