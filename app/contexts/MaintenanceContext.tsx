/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface MaintenanceContextType {
  isMaintenance: boolean
  maintenanceMessage: string | null
  setMaintenance: (isMaintenance: boolean, message?: string | null) => void
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined)

interface MaintenanceProviderProps {
  children: ReactNode
}

export const MaintenanceProvider: React.FC<MaintenanceProviderProps> = ({ children }) => {
  const [isMaintenance, setIsMaintenance] = useState<boolean>(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | null>(null)

  const setMaintenance = (maintenance: boolean, message: string | null = null) => {
    setIsMaintenance(maintenance)
    setMaintenanceMessage(message)
  }

  return (
    <MaintenanceContext.Provider value={{ isMaintenance, maintenanceMessage, setMaintenance }}>
      {children}
    </MaintenanceContext.Provider>
  )
}

export const useMaintenance = (): MaintenanceContextType => {
  const context = useContext(MaintenanceContext)
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider')
  }
  return context
}
