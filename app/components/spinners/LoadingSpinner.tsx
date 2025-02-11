/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// helpers
import { classNames } from '~/helpers/class-helper'

const LoadingSpinner: React.FC<any> = ({ title = null, subtitle = null, className = '' }: any) => {
  return (
    <div className={classNames('flex flex-col', className)}>
      <div className='c-loading_spinner flex-1 grid place-items-center'>
        <div className='c-loading_spinner-wrapper flex flex-col items-center justify-center'>
          <div className='c-loading_spinner-loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4' />
          <h2 className='text-center text-black text-xl'>{title || 'Loading...'}</h2>
          {subtitle && <p className='w-1/3 text-center text-black'>{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner
