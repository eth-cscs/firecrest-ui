/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useEffect } from 'react'
import { useFetcher } from 'react-router'
// apis
import { isMaintenancePayload, getMaintenancePayloadMessage } from '~/apis/api'
// types
import type { GetUserInfoResponse } from '~/types/api-status'
import type { MaintenancePayload } from '~/apis/api'
// contexts
import { useGroup } from '~/contexts/GroupContext'
import { useMaintenance } from '~/contexts/MaintenanceContext'

// Fetches groups client-side (useFetcher) rather than through the loader - a deferred/streamed
// loader response doesn't survive a buffering reverse proxy (e.g. Traefik) well, and could leave
// the page waiting on data that streamed fine server-side but never reached the browser intact.
// setGroups() is always called once the fetch settles, success, failure, or maintenance - see
// GroupContext's isLoadingGroups, which only flips to false there. Without that, a failed fetch
// would leave dependents (e.g. the system index redirect page) waiting on a selectedGroup that
// will never arrive, forever.
//
// Shared between the compute and filesystems system layouts (_app.compute.systems.$systemName.tsx,
// _app.filesystems.systems.$systemName.tsx) - identical fetch/fallback logic in both, only the
// system name and current URL account differ.
export default function GroupsFetcher({
  systemName,
  groupName,
}: {
  systemName: string
  groupName: string | null
}) {
  const { setGroups, setSelectedGroupName } = useGroup()
  const { setMaintenance } = useMaintenance()
  const fetcher = useFetcher<GetUserInfoResponse | MaintenancePayload | null>()

  useEffect(() => {
    fetcher.load(`/api/status/${systemName}/userinfo`)
  }, [systemName])

  useEffect(() => {
    if (fetcher.state !== 'idle' || fetcher.data === undefined) return

    // On a failed fetch (including maintenance) there's no real group list to show, but if the
    // URL already names an account (groupName), keep a synthetic group for it instead of wiping
    // to an empty list - GroupProvider seeds this same shape initially, and JobList.tsx builds
    // its API URLs from selectedGroup.name, so losing it mid-session breaks those URLs (empty
    // account segment) even though the page still looks like it's showing the right account.
    const fallbackGroups = groupName ? [{ id: groupName, name: groupName, default: false }] : []

    if (isMaintenancePayload(fetcher.data)) {
      setGroups(fallbackGroups)
      setMaintenance(true, getMaintenancePayloadMessage(fetcher.data))
      return
    }

    const userInfo = fetcher.data as GetUserInfoResponse | null
    setGroups(userInfo?.groups ?? fallbackGroups)
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
