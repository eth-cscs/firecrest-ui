/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { createContext, useContext, useState } from 'react'
// types
import type { Group } from '~/types/api-status'

type GroupContextValue = {
  groups: Group[]
  selectedGroup: Group | null
  setSelectedGroupId: (id: string) => void
}

const GroupContext = createContext<GroupContextValue | undefined>(undefined)
export function GroupProvider({
  groups,
  children,
}: {
  groups: Group[]
  children: React.ReactNode
}) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? groups[0] ?? null
  return (
    <GroupContext.Provider
      value={{
        groups,
        selectedGroup,
        setSelectedGroupId,
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
