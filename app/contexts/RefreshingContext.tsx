/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface RefreshingContextType {
  isRefreshing: boolean
  refreshMessage: string
  setRefreshing: (isRefreshing: boolean, message?: string) => void
}

const RefreshingContext = createContext<RefreshingContextType | undefined>(undefined)

interface RefreshingProviderProps {
  children: ReactNode
}

export const RefreshingProvider: React.FC<RefreshingProviderProps> = ({ children }) => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [refreshMessage, setRefreshMessage] = useState<string>('Refreshing...')

  const setRefreshing = (refreshing: boolean, message: string = 'Refreshing...') => {
    setIsRefreshing(refreshing)
    if (message) {
      setRefreshMessage(message)
    }
  }

  return (
    <RefreshingContext.Provider value={{ isRefreshing, refreshMessage, setRefreshing }}>
      {children}
    </RefreshingContext.Provider>
  )
}

export const useRefreshing = (): RefreshingContextType => {
  const context = useContext(RefreshingContext)
  if (!context) {
    throw new Error('useRefreshing must be used within a RefreshingProvider')
  }
  return context
}
