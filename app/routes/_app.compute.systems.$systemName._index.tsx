/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useRouteError } from '@remix-run/react'
import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
// loggers
import logger from '~/logger/logger'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
// utils
import { getAuthAccessToken, requireAuth, authenticator } from '~/utils/auth.server'
// apis
import { getUserInfo } from '~/apis/status-api'
// views
import ErrorView from '~/components/views/ErrorView'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Check authentication
  const { auth } = await requireAuth(request, authenticator)
  const systemName = params.systemName!
  logInfoHttp({
    message: `Compute system ${systemName} index page`,
    request: request,
    extraInfo: { username: auth.user.username },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Call api/s and fetch data
  const { group } = await getUserInfo(accessToken, systemName)
  // Redirect to default account if no account specified
  return redirect(`/compute/systems/${systemName}/accounts/${group.name}`)
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
