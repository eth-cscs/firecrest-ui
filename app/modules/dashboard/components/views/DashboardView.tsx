/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { Suspense } from 'react'
import { Await } from '@remix-run/react'
// types
import type { SystemNodesOverview } from '~/types/api-status'
// views
import SimpleView, { SimpleViewSize } from '~/components/views/SimpleView'
// stats
import SystemsStatusStat from '~/modules/status/components/stats/SystemsStatusStat'

interface DashboardViewProps {
  systems: any[]
  systemsNodesPromise: Promise<Record<string, SystemNodesOverview>>
}

const DashboardView: React.FC<DashboardViewProps> = ({ systems, systemsNodesPromise }) => {
  return (
    <SimpleView title='Dashboard' size={SimpleViewSize.FULL}>
      <Suspense fallback={<SystemsStatusStat systems={systems} />}>
        <Await resolve={systemsNodesPromise} errorElement={<SystemsStatusStat systems={systems} />}>
          {(systemsNodes: Record<string, SystemNodesOverview>) => (
            <SystemsStatusStat systems={systems} systemsNodes={systemsNodes} />
          )}
        </Await>
      </Suspense>
    </SimpleView>
  )
}

export default DashboardView
