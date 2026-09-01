/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useEffect } from 'react'
import { Outlet, useLoaderData, useRouteError, useFetcher } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
// helpers
import { logInfoHttp } from '~/helpers/log-helper'
import { logPageLabel } from '~/helpers/log-labels'
// utils
import { requireAuth } from '~/utils/auth.server'
// apis
import { isMaintenancePayload, getMaintenancePayloadMessage } from '~/apis/api'
// types
import type { GetUserInfoResponse } from '~/types/api-status'
import type { MaintenancePayload } from '~/apis/api'
// views
import ErrorView from '~/components/views/ErrorView'
// contexts
import { GroupProvider, useGroup } from '~/contexts/GroupContext'
import { useMaintenance } from '~/contexts/MaintenanceContext'
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

// Fetches groups client-side (useFetcher) rather than through the loader - a deferred/streamed
// loader response doesn't survive a buffering reverse proxy (e.g. Traefik) well, and could leave
// the page waiting on data that streamed fine server-side but never reached the browser intact.
// setGroups() is always called once the fetch settles, success or failure - see GroupContext's
// isLoadingGroups, which only flips to false there. Without that, a failed fetch would leave
// dependents (e.g. the system index redirect page) waiting on a selectedGroup that will never
// arrive, forever.
function GroupsFetcher({ systemName, groupName }: { systemName: string; groupName: string | null }) {
  const { setGroups, setSelectedGroupName } = useGroup()
  const { setMaintenance } = useMaintenance()
  const fetcher = useFetcher<GetUserInfoResponse | MaintenancePayload | null>()

  useEffect(() => {
    fetcher.load(`/api/status/${systemName}/userinfo`)
  }, [systemName])

  useEffect(() => {
    if (fetcher.state !== 'idle' || fetcher.data === undefined) return
    if (isMaintenancePayload(fetcher.data)) {
      setMaintenance(true, getMaintenancePayloadMessage(fetcher.data))
      return
    }
    const userInfo = fetcher.data as GetUserInfoResponse | null
    setGroups(userInfo?.groups ?? [])
    if (!groupName) {
      // firecrest-v2 >= 2.6.0 flags the default group per-item (group.default); older
      // backends signal it via a separate top-level UserInfo.group instead - fall back to
      // that so this works against either API generation.
      const defaultGroup = userInfo?.groups?.find((group) => group.default) ?? userInfo?.group
      if (defaultGroup) {
        setSelectedGroupName(defaultGroup.name)
      }
    }
  }, [fetcher.state, fetcher.data, groupName, setGroups, setSelectedGroupName, setMaintenance])

  return null
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
