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

type LayoutMode = 'standard' | 'fixed-right'

function useAppLayoutMode(): LayoutMode {
  const matches = useMatches()
  // First match down the tree that declares a layoutMode handle wins
  for (const m of matches) {
    const mode = (m as any)?.handle?.layoutMode as LayoutMode | undefined
    if (mode) return mode
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
  const isFixedRight = layoutMode === 'fixed-right'
  if (isFixedRight) {
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
            <main className='min-h-0 flex-1 overflow-hidden'>
              <Outlet />
            </main>
            <Footer environment={environment} appVersion={appVersion} companyName={companyName} />
          </div>
        </div>
        {/* <div className='min-h-full bg-gray-100'>
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
            <Header setSidebarOpen={setSidebarOpen} authUser={authUser} />
            <main className='min-h-0 flex-1 pr-[30rem]'>
              <Outlet />
            </main>
            <Footer environment={environment} appVersion={appVersion} companyName={companyName} />
          </div>
        </div> */}
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
