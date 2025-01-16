import React from 'react'
// views
import SimpleView, { SimpleViewSize } from '~/components/views/SimpleView'
// stats
import SystemsStatusStat from '~/modules/status/components/stats/SystemsStatusStat'
// panels
import SimplePanel from '~/components/panels/SimplePanel'
// lists
import SystemJobList from '~/modules/compute/components/lists/JobList'

const DashboardView: React.FC<any> = ({ systems, runningJobs }: any) => {
  return (
    <SimpleView title='Dashboard' size={SimpleViewSize.FULL}>
      <SystemsStatusStat systems={systems} />
      <SimplePanel title={'List of running jobs'} className='mb-4' actionsButtons={[]}>
        <SystemJobList systemsJobs={runningJobs} />
      </SimplePanel>
    </SimpleView>
  )
}

export default DashboardView
