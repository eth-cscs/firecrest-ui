/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { Suspense, useEffect } from 'react'
import { Await, Outlet, useAsyncValue, useLoaderData, useRouteError } from '@remix-run/react'
import { defer } from '@remix-run/node'
import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// loggers
import logger from '~/logger/logger'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
// utils
import { getAuthAccessToken, requireAuth } from '~/utils/auth.server'
// apis
import { getUserInfo } from '~/apis/status-api'
// types
import type { GetUserInfoResponse } from '~/types/api-status'
// views
import ErrorView from '~/components/views/ErrorView'
// contexts
import { GroupProvider, useGroup } from '~/contexts/GroupContext'
// switchers
import { GroupSwitcherPortal, GroupSwitcherLayout } from '~/components/switchers/GroupSwitcher'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Check authentication
  const { auth } = await requireAuth(request)
  const systemName = params.systemName!
  logInfoHttp({
    message: `Compute system ${systemName} layout page`,
    request: request,
    extraInfo: { username: auth.user.username },
  })
  // Get auth access token
  const accessToken = await getAuthAccessToken(request)
  // Get path params
  const groupName = params.accountName || null
  // Defer getUserInfo so the page renders immediately while groups load in background.
  // Convert any Response rejection to a plain Error so it serialises through
  // turbo-stream and reaches the ErrorBoundary with the correct message.
  const userInfoPromise = getUserInfo(accessToken, systemName).catch(async (error) => {
    if (error instanceof Response) {
      const body = await error.text().catch(() => '')
      throw new Error(`${error.status} ${error.statusText}${body ? ': ' + body : ''}`)
    }
    throw error
  })
  return defer({ userInfoPromise, groupName, systemName })
}

// Updates GroupContext with the real groups once the deferred data resolves,
// without causing a remount of the Outlet or child components.
// groupName is the accountName from the URL (null on the system index page).
function DeferredGroupsLoader({ groupName }: { groupName: string | null }) {
  const userInfo = useAsyncValue() as GetUserInfoResponse
  const { setGroups, setSelectedGroupName } = useGroup()
  useEffect(() => {
    if (userInfo?.groups) {
      setGroups(userInfo.groups)
    }
    // When there is no account in the URL (system index page) use the API's
    // default group so the client-side redirect in the index knows where to go.
    if (!groupName && userInfo?.group?.name) {
      setSelectedGroupName(userInfo.group.name)
    }
  }, [userInfo, groupName, setGroups, setSelectedGroupName])
  return null
}


export default function AppComputeIndexRoute() {
  const { userInfoPromise, groupName, systemName }: any = useLoaderData()
  // Seed the provider with a synthetic group from the URL so child components
  // that depend on selectedGroup render correctly before the real data arrives.
  const initialGroups = groupName ? [{ id: groupName, name: groupName }] : []
  return (
    <GroupProvider groups={initialGroups} groupName={groupName}>
      {/* Resolve deferred groups and push them into context without remounting children */}
      <Suspense fallback={null}>
        <Await resolve={userInfoPromise}>
          <DeferredGroupsLoader groupName={groupName} />
        </Await>
      </Suspense>
      <GroupSwitcherPortal
        systemName={systemName}
        basePath='/compute'
        layout={GroupSwitcherLayout.horizontal}
        className='hidden lg:block w-[360px]'
      />
      <Outlet />
    </GroupProvider>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  logger.error(error)
  return <ErrorView error={error} />
}
