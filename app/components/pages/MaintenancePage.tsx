/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'

const DEFAULT_MESSAGE = 'This service is currently under maintenance. Please try again later.'

interface MaintenancePageProps {
  message?: string | null
}

// Fixed/full-viewport by design: this renders from three different places in the tree (root
// ErrorBoundary, a nested route's own ErrorBoundary still inside the app chrome, and AppLayout's
// polling-driven swap) and must always cover the whole screen regardless of where it's mounted.
const MaintenancePage: React.FC<MaintenancePageProps> = ({ message }) => {
  return (
    <div className='fixed inset-0 z-50 overflow-y-auto bg-white py-16 px-6 sm:py-24'>
      <div className='mx-auto max-w-max text-center md:grid md:min-h-full md:place-items-center'>
        <main>
          <h1 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl'>
            Service Unavailable
          </h1>
          <p className='mt-4 max-w-md text-base text-gray-500'>{message || DEFAULT_MESSAGE}</p>
          <p className='mt-2 text-base text-gray-500'>
            Please refer to{' '}
            <a
              href='https://status.cscs.ch/'
              target='_blank'
              rel='noreferrer'
              className='font-medium text-red-600 hover:text-red-700'
            >
              status.cscs.ch
            </a>{' '}
            for more information.
          </p>
        </main>
      </div>
    </div>
  )
}

export default MaintenancePage
