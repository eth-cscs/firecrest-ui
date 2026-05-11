/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// env
import env from './env'
// helpers
import { getEnvVariable } from '~/helpers/env-helper'

const ui = {
  listPaginateLimit: Number(getEnvVariable(env, 'UI_LIST_PAGINATE_LIMIT', false, 20)) || 20,
}

export default ui
