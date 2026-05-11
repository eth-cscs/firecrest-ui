/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useEffect, startTransition } from 'react'
import { Outlet, useLoaderData, useRouteError } from '@remix-run/react'
import { defer } from '@remix-run/node'
import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// loggers
import logger from '~/logger/logger'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { promiseWithTimeout, DEFERRED_PROMISE_TIMEOUT_MS } from '~/helpers/promise-helper'
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
  // Resolve with null on any failure (timeout, HTTP error) rather than rejecting —
  // the page still works because groups are seeded from the URL, and DeferredGroupsLoader
  // uses optional chaining so null userInfo is handled gracefully.
  const userInfoPromise = promiseWithTimeout(
    getUserInfo(accessToken, systemName),
    DEFERRED_PROMISE_TIMEOUT_MS,
  ).catch((error) => {
    logger.warn({ error }, `Failed to load user info for system ${systemName}`)
    return null
  })
  return defer({ userInfoPromise, groupName, systemName })
}

// Awaits the deferred userInfoPromise via .then() rather than <Await> + useAsyncValue,
// so there is no dehydrated Suspense boundary that can trigger React error #421 during
// Remix's internal fetchAndApplyManifestPatches hydration pass.
function GroupsUpdater({
  promise,
  groupName,
}: {
  promise: Promise<GetUserInfoResponse | null>
  groupName: string | null
}) {
  const { setGroups, setSelectedGroupName } = useGroup()
  useEffect(() => {
    Promise.resolve(promise).then((userInfo) => {
      startTransition(() => {
        if (userInfo?.groups) {
          setGroups(userInfo.groups)
        }
        if (!groupName && userInfo?.group?.name) {
          setSelectedGroupName(userInfo.group.name)
        }
      })
    })
  }, [promise, groupName, setGroups, setSelectedGroupName])
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
      <GroupsUpdater promise={userInfoPromise} groupName={groupName} />
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
