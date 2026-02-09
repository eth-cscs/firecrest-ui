/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/
// types
import { Job } from '~/types/api-job'

export const sortJobs = (jobs: Job[]) =>
  [...jobs].sort((a, b) => {
    const aId = a.jobId ?? -Infinity
    const bId = b.jobId ?? -Infinity
    return bId - aId
  })
