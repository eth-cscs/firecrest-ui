/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { createCookie } from 'react-router'
// configs
import base from '~/configs/base.config'

// Remembers the jobs page "All users" toggle. Only read and written server-side (the page loader
// reads it, the jobs API route writes it), so there's no reason to expose it to page scripts.
export const jobsAllUsersCookie = createCookie('__jobs-all-users', {
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 365, // 1 year
  secure: base.cookieSecure,
})
