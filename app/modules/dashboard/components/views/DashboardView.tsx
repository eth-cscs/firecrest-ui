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
// panels
import SimplePanel from '~/components/panels/SimplePanel'
// lists
import SystemJobList from '~/modules/compute/components/lists/JobList'

const DashboardView: React.FC<any> = ({ systems, dashboardJobs }: any) => {
  return (
    <SimpleView title='Dashboard' size={SimpleViewSize.FULL}>
      <SystemsStatusStat systems={systems} />
      <SimplePanel title={'List of active jobs'} className='mb-4' actionsButtons={[]}>
        <SystemJobList systems={systems} systemsJobs={dashboardJobs} />
      </SimplePanel>
    </SimpleView>
  )
}

export default DashboardView
