// types
import { Job } from '~/types/api-job'
// lists
import { AttributesList, AttributesListItem } from '~/components/lists/AttributesList'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
import JobStateBadge from '~/modules/compute/components/badges/JobStateBadge'

interface JobDetailsAttributesCardProps {
  job: Job
}

const JobDetailsAttributesCard: React.FC<JobDetailsAttributesCardProps> = ({
  job,
}: JobDetailsAttributesCardProps) => {
  return (
    <AttributesList>
      <AttributesListItem label='Job ID'>#{job.jobId}</AttributesListItem>
      <AttributesListItem label='Name'>{job.name}</AttributesListItem>
      <AttributesListItem label='Status'>
        <JobStateBadge status={job.status} />
      </AttributesListItem>
      <AttributesListItem label='Submitted by'>
        <LabelBadge color={LabelColor.BLUE}>{job.user}</LabelBadge>
      </AttributesListItem>
      <AttributesListItem label='Account'>
        {job.account !== '' ? (
          <LabelBadge color={LabelColor.BLUE}>{job.account}</LabelBadge>
        ) : (
          <LabelBadge color={LabelColor.GRAY}>undefined</LabelBadge>
        )}{' '}
      </AttributesListItem>
    </AttributesList>
  )
}

export default JobDetailsAttributesCard
