/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
import { Link } from '@remix-run/react'
import { PlusIcon } from '@heroicons/react/20/solid'
// lables
import { LABEL_COMPUTE_TITLE } from '~/labels'
// alerts
import AlertError from '~/components/alerts/AlertError'
// views
import SimpleView, { SimpleViewSize } from '~/components/views/SimpleView'
// panels
import SimplePanel from '~/components/panels/SimplePanel'
// lists
import JobList from '~/modules/compute/components/lists/JobList'
// contexts
import { useSystem } from '~/contexts/SystemContext'
import { useGroup } from '~/contexts/GroupContext'

// stats
import SystemInfo from '~/modules/status/components/stats/SystemInfo'

const JobListView: React.FC<any> = ({ jobs }) => {
  const { selectedSystem } = useSystem()
  const { selectedGroup } = useGroup()

  const handleClickReload = () => {
    window.location.reload()
  }

  const actionsButtons = (
    <>
      <Link
        to={`/compute/systems/${selectedSystem?.name}/accounts/${selectedGroup?.name}/submit`}
        className='inline-flex items-center ml-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
      >
        <PlusIcon className='-ml-1 mr-2 h-5 w-5 text-gray-500' aria-hidden='true' />
        Submit new Job
      </Link>
    </>
  )
  return (
    <SimpleView title={`${LABEL_COMPUTE_TITLE}`} size={SimpleViewSize.FULL}>
      <SimplePanel title={`List of jobs`} className='mb-4' actionsButtons={actionsButtons}>
        <AlertError error={jobs.error} />
        <div className='mb-6'>
          <SystemInfo system={selectedSystem!} />
        </div>
        <JobList jobs={jobs} />
      </SimplePanel>
    </SimpleView>
  )
}

export default JobListView
