import _ from 'lodash'
// tyoes
import { Job, JobStateStatus } from '~/types/api-job'

export const jobCanBeCanceled = (job: Job): boolean => {
  return [JobStateStatus.PENDING, JobStateStatus.RUNNING].includes(job.status.state)
}

export const jobCanBeRetried = (job: Job): boolean => {
  return job.status.state === JobStateStatus.FAILED
}
