import {
  CheckCircleIcon,
  ClockIcon,
  EllipsisHorizontalCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
// types
import { JobState, JobStateStatus, JobStatus } from '~/types/api-job'
// helpers
import { classNames } from '~/helpers/class-helper'

const color = (state: JobStateStatus) => {
  if (state.includes('CANCELLED')) {
    return 'red'
  }
  switch (state) {
    case JobStateStatus.RUNNING:
      return 'blue'
    case JobStateStatus.COMPLETED:
      return 'green'
    case JobStateStatus.FAILED:
      return 'red'
    default:
      return 'gray'
  }
}

const icon = (state: JobStateStatus) => {
  if (state.includes('CANCELLED')) {
    return <XCircleIcon className='w-5 h-5 text-red-700' />
  }
  switch (state) {
    case JobStateStatus.RUNNING:
      return <ClockIcon className='w-5 h-5 text-blue-700' />
    case JobStateStatus.COMPLETED:
      return <CheckCircleIcon className='w-5 h-5 text-green-700' />
    case JobStateStatus.FAILED:
      return <XCircleIcon className='w-5 h-5 text-red-700' />
    default:
      return <EllipsisHorizontalCircleIcon className='w-5 h-5 text-gray-700' />
  }
}

interface JobStateBadgeProps {
  status: JobStatus
  className?: string
}

const JobStateBadge: React.FC<JobStateBadgeProps> = ({ status, className }: JobStateBadgeProps) => {
  const state = status.state
  const classes = `inline-flex items-center gap-x-1.5 rounded-md 
  bg-${color(state)}-100 px-1.5 mb-2 py-0.5 text-sm font-medium 
  text-${color(state)}-700 ring-1 ring-inset ring-${color(state)}-600/20`
  return (
    <span className={classNames(classes, className || '')}>
      {icon(state)}
      <span className={`font-medium text-${color(state)}-700`}>{state}</span>
    </span>
  )
}

export default JobStateBadge
