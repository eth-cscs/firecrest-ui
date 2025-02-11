/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'

const SimpleView: React.FC<any> = ({ children, title }: any) => {
  return (
    <div className='py-6'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 md:px-8'>
        <h1 className='text-2xl font-semibold text-gray-900'>{title}</h1>
      </div>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4'>{children}</div>
    </div>
  )
}

export default SimpleView
