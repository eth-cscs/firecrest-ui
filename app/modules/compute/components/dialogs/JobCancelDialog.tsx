/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useState } from 'react'
// types
import { Job } from '~/types/api-job'
import { System } from '~/types/api-status'
// helpers
import { classNames } from '~/helpers/class-helper'
// dialogs
import SimpleDialog from '~/components/dialogs/SimpleDialog'
// buttons
import LoadingButton from '~/components/buttons/LoadingButton'

interface JobCancelDialog {
  job: Job
  system: System
  open: boolean
  onClose: () => void
}

const JobCancelDialog: React.FC<JobCancelDialog> = ({
  job,
  system,
  open,
  onClose,
}: JobCancelDialog) => {
  const [loading, setLoading] = useState(false)
  const actionButtons = (
    <form
      action={`/compute/systems/${system.name}/jobs/${job.jobId}`}
      method='post'
      onSubmit={() => setLoading(true)}
    >
      <input type='hidden' name='intent' value='delete' />
      <LoadingButton isLoading={loading} className='ml-2 sm:w-auto sm:text-sm'>
        <button
          type='submit'
          className={classNames(
            !loading ? '' : 'opacity-50 cursor-not-allowed',
            'ml-2 inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto',
          )}
          disabled={loading}
        >
          Cancel Job
        </button>
      </LoadingButton>
    </form>
  )
  return (
    <SimpleDialog
      title='Cancel Job'
      open={open}
      onClose={onClose}
      actionButtons={actionButtons}
      isLoading={loading}
    >
      <p className='text-sm text-gray-500'>
        Do you want to cancel the job with name <b>&quot;{job.name}&quot;</b> and id{' '}
        <b>&quot;{job.jobId}&quot;</b>?
      </p>
    </SimpleDialog>
  )
}

export default JobCancelDialog
