/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { LoaderFunctionArgs } from '@remix-run/node'
// utils
import { getAuthenticator } from '~/utils/auth.server'
import { safeRedirect } from '~/utils/redirect.server'
import { returnToCookie } from '~/utils/session.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const authenticator = await getAuthenticator()
  const cookieHeader = request.headers.get('Cookie')
  const returnTo = safeRedirect(await returnToCookie.parse(cookieHeader), '/')
  return await authenticator.authenticate('oidc', request, {
    successRedirect: returnTo,
    failureRedirect: '/login',
  })
}
