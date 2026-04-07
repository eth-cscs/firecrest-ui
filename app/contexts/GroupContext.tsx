/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { createContext, useContext, useState, useEffect } from 'react'
// types
import type { Group } from '~/types/api-status'

type GroupContextValue = {
  groups: Group[]
  selectedGroup: Group | null
  isLoadingGroups: boolean
  setSelectedGroupName: (name: string) => void
  setGroups: (groups: Group[]) => void
}

const GroupContext = createContext<GroupContextValue | undefined>(undefined)
export function GroupProvider({
  groups: initialGroups,
  groupName,
  children,
}: {
  groups: Group[]
  groupName?: string | null
  children: React.ReactNode
}) {
  const [groups, setGroupsState] = useState<Group[]>(initialGroups)
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null)
  const setGroups = (newGroups: Group[]) => {
    setGroupsState(newGroups)
    setIsLoadingGroups(false)
  }
  const selectedGroup = groups.find((g) => g.name === selectedGroupName) ?? groups[0] ?? null

  useEffect(() => {
    if (groups.length === 0) {
      setSelectedGroupName(null)
      return
    }
    if (groupName) {
      const selectedGroupCheck = groups.find((g) => g.name === groupName) ?? groups[0] ?? null
      if (selectedGroupCheck) {
        setSelectedGroupName(selectedGroupCheck.name)
      }
    }
  }, [groups, groupName])

  return (
    <GroupContext.Provider
      value={{
        groups,
        selectedGroup,
        isLoadingGroups,
        setSelectedGroupName,
        setGroups,
      }}
    >
      {children}
    </GroupContext.Provider>
  )
}

export function useGroup() {
  const ctx = useContext(GroupContext)
  if (!ctx) throw new Error('useGroup must be used within GroupProvider')
  return ctx
}
