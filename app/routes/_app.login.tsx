/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// utils
import { authenticator } from '~/utils/auth.server'
import { returnToCookie } from '~/utils/session.server'
import { isRedirectResponse, safeRedirect } from '~/utils/redirect.server'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Get returnTo from query param and set cookie if needed
  const url = new URL(request.url)
  const returnToParam = url.searchParams.get('returnTo')
  const returnTo = safeRedirect(returnToParam, '/')
  try {
    // If the user is already authenticated, they can be redirected directly to returnTo here.
    // If not, this call "throws" a redirect Response to Keycloak.
    return await authenticator.authenticate('keycloak', request, {
      successRedirect: returnTo,
      failureRedirect: '/login',
    })
  } catch (error) {
    // If it's a redirect response, append the returnTo cookie
    if (error instanceof Response && isRedirectResponse(error) && returnToParam) {
      error.headers.append('Set-Cookie', await returnToCookie.serialize(returnTo))
      return error
    }
    throw error
  }
}
