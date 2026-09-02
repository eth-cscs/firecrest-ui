/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { redirect } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
// utils
import { getLogoutUrl } from '~/utils/auth.server'
import { getSession, destroySession } from '~/utils/session.server'

// remix-auth v4's Authenticator has no built-in session/logout, so the session is
// destroyed here directly (same as the plain /logout route) before redirecting to
// the OIDC provider's end_session_endpoint.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [logoutUrl, session] = await Promise.all([
    getLogoutUrl(),
    getSession(request.headers.get('Cookie')),
  ])
  return redirect(logoutUrl, {
    headers: { 'Set-Cookie': await destroySession(session) },
  })
}
