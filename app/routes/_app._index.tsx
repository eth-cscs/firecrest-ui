/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useRouteError } from '@remix-run/react'
import { data } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { LogPage } from '~/helpers/log-labels'
// utils
import { requireAuth } from '~/utils/auth.server'
// contexts
import { useSystem } from '~/contexts/SystemContext'
// views
import ErrorView from '~/components/views/ErrorView'
import DashboardView from '~/modules/dashboard/components/views/DashboardView'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { auth } = await requireAuth(request)
  logInfoHttp({
    eventAction: LogPage.INDEX,
    request: request,
    extraInfo: { username: auth.user.username },
  })
  return data({})
}

export default function AppIndexRoute() {
  const { systems } = useSystem()
  return <DashboardView systems={systems} />
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return <ErrorView error={error} />
}
