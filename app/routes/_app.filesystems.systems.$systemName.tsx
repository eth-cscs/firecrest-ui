/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { Outlet, useLoaderData, useRouteError } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { logPageLabel } from '~/helpers/log-labels'
// utils
import { requireAuth } from '~/utils/auth.server'
// views
import ErrorView from '~/components/views/ErrorView'
// contexts
import { GroupProvider } from '~/contexts/GroupContext'
import GroupsFetcher from '~/contexts/GroupsFetcher'
// switchers
import { GroupSwitcherPortal, GroupSwitcherLayout } from '~/components/switchers/GroupSwitcher'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // Check authentication
  const { auth } = await requireAuth(request)
  const systemName = params.systemName!
  logInfoHttp({
    eventAction: logPageLabel.filesystemLayout(systemName),
    request: request,
    extraInfo: { username: auth.user.username, system: systemName },
  })
  // Get path params
  const groupName = params.accountName || null
  return { groupName, systemName }
}

export default function AppFilesystemsIndexRoute() {
  const { groupName, systemName }: any = useLoaderData()
  // Seed the provider with a synthetic group from the URL so child components
  // that depend on selectedGroup render correctly before the real data arrives.
  const initialGroups = groupName ? [{ id: groupName, name: groupName, default: false }] : []
  return (
    <GroupProvider groups={initialGroups} groupName={groupName}>
      <GroupsFetcher systemName={systemName} groupName={groupName} />
      <GroupSwitcherPortal
        systemName={systemName}
        basePath='/filesystems'
        layout={GroupSwitcherLayout.horizontal}
        className='hidden lg:block w-[360px]'
      />
      <Outlet />
    </GroupProvider>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return <ErrorView error={error} />
}
