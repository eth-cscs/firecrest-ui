/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// env
import env from './env'
// helpers
import { getEnvVariable } from '~/helpers/env-helper'

const redis = {
  active: getEnvVariable(env, 'REDIS_ACTIVE', false, false, true),
  port: getEnvVariable(env, 'REDIS_PORT', false, 6379),
  host: getEnvVariable(env, 'REDIS_HOST', false),
  authPassword: getEnvVariable(env, 'REDIS_AUTH_PASSWORD', false),
}

export default redis
