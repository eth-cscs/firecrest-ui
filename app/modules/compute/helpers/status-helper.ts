/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import _ from 'lodash'
// tyoes
import { Job, JobStateStatus } from '~/types/api-job'

export const jobCanBeCanceled = (job: Job): boolean => {
  return [JobStateStatus.PENDING, JobStateStatus.RUNNING].includes(job.status.state)
}

export const jobCanBeRetried = (job: Job): boolean => {
  return job.status.state === JobStateStatus.FAILED
}
