/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
// types
import type { SystemNodesOverview } from '~/types/api-status'
// views
import SimpleView, { SimpleViewSize } from '~/components/views/SimpleView'
// stats
import SystemsStatusStat from '~/modules/status/components/stats/SystemsStatusStat'

interface DashboardViewProps {
  systems: any[]
  systemsNodesPromise: Promise<Record<string, Promise<SystemNodesOverview | null>>>
}

const DashboardView: React.FC<DashboardViewProps> = ({ systems, systemsNodesPromise }) => {
  return (
    <SimpleView title='Dashboard' size={SimpleViewSize.FULL}>
      <SystemsStatusStat systems={systems} systemsNodesPromise={systemsNodesPromise} />
    </SimpleView>
  )
}

export default DashboardView
