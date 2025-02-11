/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
// views
import SimpleView from '~/components/views/SimpleView'
// panels
import SimplePanel from '~/components/panels/SimplePanel'
// alerts
import AlertError from '~/components/alerts/AlertError'
// forms
import JobSubmitForm from '~/modules/compute/components/forms/JobSubmitForm'

const JobSubmitView: React.FC<any> = ({ formData, error }: any) => {
  return (
    <SimpleView title='Compute'>
      <SimplePanel title='Submit job by uploading a local sbatch file' className='mb-4'>
        <AlertError error={error} />
        <JobSubmitForm formError={error} formData={formData} />
      </SimplePanel>
    </SimpleView>
  )
}

export default JobSubmitView
