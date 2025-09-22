/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import env from './env'
import { getEnvVariable } from '~/helpers/env-helper'

const observability = {
  dashboard: getEnvVariable(env, 'UI_OBSERVABILITY_DASHBOARD', false, '', false),
}

export default observability
