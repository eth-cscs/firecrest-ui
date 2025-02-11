/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// utils
import { authenticator, logoutUrl } from '~/utils/auth.server'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  await authenticator.logout(request, { redirectTo: logoutUrl })
}
