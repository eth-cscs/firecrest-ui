/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { createContext, useContext, useState, useEffect } from 'react'

// types
import type { System } from '~/types/api-status'

type SystemContextValue = {
  systems: System[]
  selectedSystem: System | null
  setSelectedSystemName: (name: string) => void
}

const SystemContext = createContext<SystemContextValue | undefined>(undefined)
export function SystemProvider({
  systems,
  systemName,
  children,
}: {
  systems: System[]
  systemName?: string | null
  children: React.ReactNode
}) {
  const [selectedSystemName, setSelectedSystemName] = useState<string | null>(null)
  const selectedSystem = systems.find((g) => g.name === selectedSystemName) ?? systems[0] ?? null

  useEffect(() => {
    if (systems.length === 0) {
      setSelectedSystemName(null)
      return
    }
    if (systemName) {
      const selectedSystemCheck = systems.find((g) => g.name === systemName) ?? systems[0] ?? null
      if (selectedSystemCheck) {
        setSelectedSystemName(selectedSystemCheck.name)
      }
    }
  }, [systems, systemName])

  return (
    <SystemContext.Provider
      value={{
        systems,
        selectedSystem,
        setSelectedSystemName,
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
