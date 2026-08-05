/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { redirect } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
// utils
import { getAuthenticator, AUTH_SESSION_KEY } from '~/utils/auth.server'
import { safeRedirect } from '~/utils/redirect.server'
import { returnToCookie, getSession, commitSession } from '~/utils/session.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const authenticator = await getAuthenticator()
  const cookieHeader = request.headers.get('Cookie')
  const returnTo = safeRedirect(await returnToCookie.parse(cookieHeader), '/')

  // The provider's redirect carries `state`/`code`, so this resolves the OAuth2
  // flow and returns the authenticated user instead of throwing a redirect.
  const auth = await authenticator.authenticate('oidc', request)

  const session = await getSession(cookieHeader)
  session.set(AUTH_SESSION_KEY, auth)
  return redirect(returnTo, {
    headers: { 'Set-Cookie': await commitSession(session) },
  })
}
