/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import pino from 'pino'
// configs
import loggerConfig from '~/configs/logger.config'
import base from '~/configs/base.config'

const logger = pino({
  level: loggerConfig.loggingLevel,
  messageKey: 'message',
  timestamp: () => `,"@timestamp":"${new Date().toISOString()}"`,
  base: {
    'service.name': base.serviceName,
    'service.version': base.appVersion ?? 'unknown',
    'service.environment': base.environment,
  },
  formatters: {
    level: (label) => ({ 'log.level': label }),
    bindings: (b) => ({ 'host.name': b.hostname }),
  },
})

export default logger
