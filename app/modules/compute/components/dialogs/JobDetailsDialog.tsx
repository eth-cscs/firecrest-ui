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

interface JobDetailsDialog {
  job: Job
  open: any
  onClose: any
}

const JobDetailsDialog: React.FC<JobDetailsDialog> = ({ job, open, onClose }: JobDetailsDialog) => {
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
