/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useState } from 'react'
import { Outlet, useMatches } from '@remix-run/react'
// types
import type { AuthUser } from '~/types/auth'
import type { NotificationMessage } from '~/types/notification'
// layouts
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
// overlays
import NotificationOverlay from '~/components/overlays/NotificationOverlay'

type LayoutMode = 'standard' | 'fixed-right' | 'dashboard'

function useAppLayoutMode(): LayoutMode {
  const matches = useMatches()
  // First match down the tree that declares a layoutMode handle wins
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i] as any
    const fromData = m?.data?.layoutMode as LayoutMode | null | undefined
    if (fromData === 'fixed-right' || fromData === 'standard' || fromData === 'dashboard')
      return fromData
    const fromHandle = m?.handle?.layoutMode as LayoutMode | undefined
    if (fromHandle === 'fixed-right' || fromHandle === 'standard' || fromHandle === 'dashboard')
      return fromHandle
  }
  return 'standard'
}

interface AppLayoutProps {
  environment: string
  appName: string
  appVersion: string
  companyName: string
  logoPath: string | null
  authUser: AuthUser
  notificationMessages: Array<NotificationMessage>
  supportUrl: string | null
  docUrl: string | null
  repoUrl: string | null
}

const AppLayout: React.FC<AppLayoutProps> = ({
  environment,
  appName,
  appVersion,
  companyName,
  logoPath,
  authUser,
  notificationMessages,
  supportUrl,
  docUrl,
  repoUrl,
}: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const layoutMode = useAppLayoutMode()
  if (layoutMode === 'fixed-right') {
    return (
      <>
        <div className='min-h-full bg-gray-100'>
          <div className='stacked-notifications'>
            <NotificationOverlay messages={notificationMessages} />
          </div>
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            appName={appName}
            supportUrl={supportUrl}
            docUrl={docUrl}
            repoUrl={repoUrl}
            logoPath={logoPath}
          />
          <div className='md:pl-64 flex flex-col flex-1 min-h-screen'>
            <Header setSidebarOpen={setSidebarOpen} authUser={authUser} fixed={true} />
            <main className='min-h-0 flex flex-1 flex-col pr-[30rem] mt-[4rem]'>
              <Outlet />
            </main>
            <Footer
              environment={environment}
              appVersion={appVersion}
              companyName={companyName}
              fixed={true}
            />
          </div>
        </div>
      </>
    )
  } else if (layoutMode === 'dashboard') {
    return (
      <>
        <div className='min-h-full bg-gray-100'>
          <div className='stacked-notifications'>
            <NotificationOverlay messages={notificationMessages} />
          </div>
          <div className='flex flex-col h-full min-h-screen'>
            <Header
              setSidebarOpen={setSidebarOpen}
              authUser={authUser}
              withLogo={true}
              logoPath={logoPath}
              appName={appName}
            />
            <main className='flex-1 min-h-0 overflow-y-auto mt-4'>
              <Outlet />
            </main>
            <Footer environment={environment} appVersion={appVersion} companyName={companyName} />
          </div>
        </div>
      </>
    )
  }
  return (
    <>
      <div className='h-screen bg-gray-100'>
        <div className='stacked-notifications'>
          <NotificationOverlay messages={notificationMessages} />
        </div>
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          appName={appName}
          supportUrl={supportUrl}
          docUrl={docUrl}
          repoUrl={repoUrl}
          logoPath={logoPath}
        />
        <div className='md:pl-64 flex flex-col h-full min-h-0'>
          <Header setSidebarOpen={setSidebarOpen} authUser={authUser} />
          <main className='flex-1 min-h-0 overflow-y-auto'>
            <Outlet />
          </main>
          <Footer environment={environment} appVersion={appVersion} companyName={companyName} />
        </div>
      </div>
    </>
  )
}

export default AppLayout
