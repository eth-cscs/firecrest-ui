/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
// badges
import EnvironmentBadge from '~/components/badges/EnvironmentBadge'

interface FooterProps {
  environment: string
  appVersion: string
  companyName: string
  fixed?: boolean
}

const Footer: React.FC<FooterProps> = ({
  environment,
  appVersion,
  companyName,
  fixed = false,
}: FooterProps) => {
  const version = appVersion ? appVersion : 'unknown'

  return (
    <footer
      className={`bottom-0 z-10 h-12 bg-white shadow ${fixed ? 'fixed left-64 right-0' : 'sticky'}`}
    >
      <div className='flex items-center justify-between'>
        <div className='pl-3 pt-3'>
          <p className='text-xs text-xs text-gray-400'>
            &copy; {new Date().getFullYear()}
            {companyName !== null ? ` ${companyName}` : ''} - All rights reserved
          </p>
        </div>
        <div className='pr-3 pt-3 inline-flex items-center'>
          <EnvironmentBadge environment={environment} className='mr-4' />
          {version && (
            <p className='text-right text-xs text-gray-400'>
              Version <span className='text-gray-800'>{version}</span>
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}

export default Footer
