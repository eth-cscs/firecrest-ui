/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'
// helpers
import { classNames } from '~/helpers/class-helper'

const AlertWarning: React.FC<any> = ({
  children,
  message = null,
  title = null,
  className = '',
}: any) => {
  return (
    <div className={classNames('rounded-md bg-yellow-50 p-4', className)}>
      <div className='flex'>
        <div className='flex-shrink-0'>
          <ExclamationTriangleIcon className='h-5 w-5 text-yellow-400' aria-hidden='true' />
        </div>
        <div className='ml-3'>
          {title && <h3 className='mb-2 text-sm font-medium text-yellow-800'>{title}</h3>}
          <div className='text-sm text-yellow-700'>{children ? children : <p>{message}</p>}</div>
        </div>
      </div>
    </div>
  )
}

export default AlertWarning
