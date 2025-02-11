/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { InformationCircleIcon } from '@heroicons/react/24/outline'

const AlertInfo: React.FC<any> = ({
  children,
  message = '',
  title = null,
  className = '',
}: any) => {
  return (
    <div className={className}>
      <div className='rounded-md bg-blue-50 p-4'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <InformationCircleIcon className='h-5 w-5 text-blue-400' aria-hidden='true' />
          </div>
          <div className='ml-3'>
            {title && <h3 className='mb-2 text-sm font-medium text-blue-700'>{title}</h3>}
            <div className='text-sm text-blue-700'>{children ? children : message}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertInfo
