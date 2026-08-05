/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
import { useRouteLoaderData } from '@remix-run/react'
// logos
import AppLogo from '~/logos/AppLogo'

const DEFAULT_MESSAGE = 'This service is currently under maintenance. Please try again later.'

interface MaintenancePageProps {
  message?: string | null
}

// Fixed/full-viewport by design: this renders from three different places in the tree (root
// ErrorBoundary, a nested route's own ErrorBoundary still inside the app chrome, and AppLayout's
// polling-driven swap) and must always cover the whole screen regardless of where it's mounted -
// which also means the sidebar/header (where the logo+appName normally live) is always hidden
// underneath it. Reads branding straight off route loader data instead of taking it as props, so
// every call site gets it "for free" without individually threading it through - falls back from
// the closest layout route to root, since which loaders succeeded depends on where the error hit.
const MaintenancePage: React.FC<MaintenancePageProps> = ({ message }) => {
  const appData: any = useRouteLoaderData('routes/_app')
  const rootData: any = useRouteLoaderData('root')
  const appName = appData?.appName ?? rootData?.appName ?? null
  const logoPath = appData?.logoPath ?? rootData?.logoPath ?? null
  const statusUrl = appData?.statusUrl ?? rootData?.statusUrl ?? null

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto bg-white py-16 px-6 sm:py-24'>
      <div className='mx-auto max-w-max text-center md:grid md:min-h-full md:place-items-center'>
        <main>
          {(logoPath || appName) && (
            <div className='mb-6 flex items-center justify-center'>
              {logoPath && <AppLogo className='h-12 w-auto' logoPath={logoPath} />}
              {appName && <span className='ml-2 relative text-gray-900'>{appName}</span>}
            </div>
          )}
          <h1 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl'>
            Service Unavailable
          </h1>
          <p className='mt-4 max-w-md text-base text-gray-500'>{message || DEFAULT_MESSAGE}</p>
          {statusUrl && (
            <p className='mt-2 text-base text-gray-500'>
              Please refer to{' '}
              <a
                href={statusUrl}
                target='_blank'
                rel='noreferrer'
                className='font-medium text-red-600 hover:text-red-700'
              >
                {statusUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>{' '}
              for more information.
            </p>
          )}
        </main>
      </div>
    </div>
  )
}

export default MaintenancePage
