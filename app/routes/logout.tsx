/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { redirect } from 'react-router'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
// utils
import { getSession, destroySession } from '~/utils/session.server'

const logout = async (request: Request) => {
  const session = await getSession(request.headers.get('Cookie'))
  return redirect('/', {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  })
}

export async function loader({ request }: LoaderFunctionArgs) {
  return logout(request)
}

export async function action({ request }: ActionFunctionArgs) {
  return logout(request)
}
