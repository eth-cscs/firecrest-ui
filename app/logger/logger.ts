/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import pino from 'pino'
// configs
import loggerConfig from '~/configs/logger.config'

const logger = pino({
  level: loggerConfig.loggingLevel,
})

export default logger
