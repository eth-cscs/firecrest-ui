/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { Outlet, useLoaderData, useRouteError } from '@remix-run/react'
import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// loggers
import logger from '~/logger/logger'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
// utils
import { getAuthAccessToken, authenticator } from '~/utils/auth.server'
// apis
import { getUserInfo } from '~/apis/status-api'
// views
import ErrorView from '~/components/views/ErrorView'
// contexts
import { GroupProvider } from '~/contexts/GroupContext'
// switchers
// import { GroupSwitcherPortal } from '~/components/switchers/GroupSwitcher'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Check authentication
  const auth = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  })
  const systemName = params.systemName!
  logInfoHttp({
    message: `Filesystems system ${systemName} layout page`,
    request: request,
    extraInfo: { username: auth.user.username },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Get path params
  const groupName = params.accountName || null
  // Call api/s and fetch data
  const { groups } = await getUserInfo(accessToken, systemName)
  // Return response
  return { groups, groupName, systemName }
}

export default function AppFilesystemsIndexRoute() {
  const { groups, systemName, groupName }: any = useLoaderData()
  return (
    <GroupProvider groups={groups} groupName={groupName}>
      {/* <GroupSwitcherPortal systemName={systemName} basePath='/filesystems' /> */}
      <Outlet />
    </GroupProvider>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
