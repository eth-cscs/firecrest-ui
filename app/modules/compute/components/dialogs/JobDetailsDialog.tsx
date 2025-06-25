/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// types
import { Job } from '~/types/api-job'
// helpers
import { formatDateTimeFromTimestamp } from '~/helpers/date-helper'
// badges
import JobStateBadge from '~/modules/compute/components/badges/JobStateBadge'
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
// dialogs
import SimpleDialog from '~/components/dialogs/SimpleDialog'
// lists
import DescriptionList from '~/components/lists/DescriptionList'
import { formatTime } from '~/helpers/time-helper'

interface JobDetailsDialogData {
  job: Job
  open: any
  onClose: any
}

const JobDetailsDialog: React.FC<JobDetailsDialogData> = ({
  job,
  open,
  onClose,
}: JobDetailsDialogData) => {
  const data = [
    {
      label: 'Status',
      content: <JobStateBadge status={job.status} />,
    },
    {
      label: 'Cluster',
      content: <LabelBadge color={LabelColor.YELLOW}>{job.cluster}</LabelBadge>,
    },
    {
      label: 'Id',
      content: job.jobId,
    },
    {
      label: 'Name',
      content: job.name,
    },
    {
      label: 'Nodes',
      content: job.nodes,
    },
    {
      label: 'Partition',
      content: job.partition,
    },
    {
      label: 'Start time',
      content: formatDateTimeFromTimestamp({ timestamp: job.time.start }),
    },
    {
      label: 'Execution time',
      content: formatTime({ time: job.time.elapsed }),
    },
    {
      label: 'Submitted by',
      content: <LabelBadge color={LabelColor.BLUE}>{job.user}</LabelBadge>,
    },
  ]
  return (
    <SimpleDialog
      title={`Job "${job.name}"`}
      subtitle='Job details and information'
      open={open}
      onClose={onClose}
    >
      <DescriptionList data={data} />
    </SimpleDialog>
  )
}

export default JobDetailsDialog
