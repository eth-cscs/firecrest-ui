/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import _ from 'lodash'
import React from 'react'
// helpers
import { classNames } from '~/helpers/class-helper'
// components
import SystemStatusStat from '~/modules/status/components/stats/SystemStatusStat'

const SystemsStatusStatList: React.FC<any> = ({ systems }) => {
  return (
    <div className='mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 items-start'>
      {systems &&
        systems.length > 0 &&
        systems.map((system: any, index: number) => (
          <SystemStatusStat system={system} key={system.name} />
        ))}
    </div>
  )
}

const SystemsStatusStat: React.FC<any> = ({ systems, className = '' }: any) => {
  return (
    <div className={classNames('mb-4', className)}>
      <h3 className='text-base font-semibold leading-6 text-gray-900'>Systems status</h3>
      <SystemsStatusStatList systems={systems} />
    </div>
  )
}

export default SystemsStatusStat
