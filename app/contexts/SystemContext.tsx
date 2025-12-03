/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { createContext, useContext, useState } from 'react'

type System = {
  id: string
  name: string
}

type SystemContextValue = {
  systems: System[]
  selectedSystem: System | null
  setSelectedSystemId: (id: string) => void
}

const SystemContext = createContext<SystemContextValue | undefined>(undefined)
export function SystemProvider({
  systems,
  children,
}: {
  systems: System[]
  children: React.ReactNode
}) {
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null)
  const selectedSystem = systems.find((g) => g.id === selectedSystemId) ?? systems[0] ?? null
  return (
    <SystemContext.Provider
      value={{
        systems,
        selectedSystem,
        setSelectedSystemId,
      }}
    >
      {children}
    </SystemContext.Provider>
  )
}

export function useSystem() {
  const ctx = useContext(SystemContext)
  if (!ctx) throw new Error('useSystem must be used within SystemProvider')
  return ctx
}
