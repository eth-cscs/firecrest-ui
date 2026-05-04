/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// utils
import { getAuthenticator, getLogoutUrl } from '~/utils/auth.server'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const [authenticator, logoutUrl] = await Promise.all([getAuthenticator(), getLogoutUrl()])
  await authenticator.logout(request, { redirectTo: logoutUrl })
}
