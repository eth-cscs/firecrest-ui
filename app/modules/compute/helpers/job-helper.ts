/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/
// types
import { Job } from '~/types/api-job'

export const sortJobs = (jobs: Job[]) => [...jobs].sort((a, b) => Number(b.jobId) - Number(a.jobId))

// Backend limit for the jobs `name` filter (based on OpenPBS); longer values get a 422.
export const JOB_NAME_FILTER_MAX_LENGTH = 235

// Trims and caps a job name filter so the backend never sees a value it would reject.
export const normalizeJobNameFilter = (value: string | null | undefined): string =>
  (value ?? '').trim().slice(0, JOB_NAME_FILTER_MAX_LENGTH)
