/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { redirect } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
// utils
import { getAuthenticator, getAuth } from '~/utils/auth.server'
import { returnToCookie } from '~/utils/session.server'
import { isRedirectResponse, safeRedirect } from '~/utils/redirect.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get returnTo from query param and set cookie if needed
  const url = new URL(request.url)
  const returnToParam = url.searchParams.get('returnTo')
  const returnTo = safeRedirect(returnToParam, '/')

  // If the user is already authenticated, redirect directly to returnTo — remix-auth
  // v4's Authenticator has no session concept of its own, so this check is now ours.
  const auth = await getAuth(request)
  if (auth) return redirect(returnTo)

  const authenticator = await getAuthenticator()
  try {
    // No `state` query param present yet, so this always throws a redirect
    // Response to the OIDC provider rather than returning.
    return await authenticator.authenticate('oidc', request)
  } catch (error) {
    // If it's a redirect response, append the returnTo cookie
    if (error instanceof Response && isRedirectResponse(error) && returnToParam) {
      error.headers.append('Set-Cookie', await returnToCookie.serialize(returnTo))
      return error
    }
    throw error
  }
}
