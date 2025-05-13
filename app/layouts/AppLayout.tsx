/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useState } from 'react'
import { Outlet } from '@remix-run/react'
// types
import type { AuthUser } from '~/types/auth'
import type { NotificationMessage } from '~/types/notification'
// layouts
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
// overlays
import NotificationOverlay from '~/components/overlays/NotificationOverlay'

interface AppLayoutProps {
  environment: string
  appVersion: string
  companyName: string
  logoPath: string | null
  platformName: string
  authUser: AuthUser
  notificationMessages: Array<NotificationMessage>
  supportUrl: string | null
  docUrl: string | null
  repoUrl: string | null
}

const AppLayout: React.FC<AppLayoutProps> = ({
  environment,
  appVersion,
  companyName,
  logoPath,
  platformName,
  authUser,
  notificationMessages,
  supportUrl,
  docUrl,
  repoUrl,
}: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  return (
    <>
      <div className='min-h-full bg-gray-100'>
        <div className='stacked-notifications'>
          <NotificationOverlay messages={notificationMessages} />
        </div>
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          platformName={platformName}
          supportUrl={supportUrl}
          docUrl={docUrl}
          repoUrl={repoUrl}
          logoPath={logoPath}
        />
        <div className='md:pl-64 flex flex-col flex-1 min-h-screen'>
          <Header setSidebarOpen={setSidebarOpen} authUser={authUser} />
          <main className='flex-1'>
            <Outlet />
          </main>
          <Footer environment={environment} appVersion={appVersion} companyName={companyName} />
        </div>
      </div>
    </>
  )
}

export default AppLayout
