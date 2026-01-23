/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/
// types
import { Job } from '~/types/api-job'

export const sortJobs = (jobs: Job[]) =>
  [...jobs].sort((a, b) => {
    if (b.time.start !== a.time.start) {
      return b.time.start - a.time.start
    }
    return b.jobId - a.jobId
  })
