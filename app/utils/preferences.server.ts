/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { createCookie } from '@remix-run/node'
// configs
import base from '~/configs/base.config'

// Non-sensitive UI preference, readable client-side (not httpOnly) so pages can
// read/refresh it, but always written server-side via a Set-Cookie response header
// so its (JSON-encoded) value stays in the format createCookie expects to parse.
export const jobsAllUsersCookie = createCookie('__jobs-all-users', {
  path: '/',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 365, // 1 year
  secure: base.cookieSecure,
})
