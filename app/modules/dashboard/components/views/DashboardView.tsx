/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
// views
import SimpleView, { SimpleViewSize } from '~/components/views/SimpleView'
// stats
import SystemsStatusStat from '~/modules/status/components/stats/SystemsStatusStat'


const DashboardView: React.FC<any> = ({ systems }: any) => {
  return (
    <SimpleView title='Dashboard' size={SimpleViewSize.FULL}>
      <SystemsStatusStat systems={systems} />
     
    </SimpleView>
  )
}

export default DashboardView
