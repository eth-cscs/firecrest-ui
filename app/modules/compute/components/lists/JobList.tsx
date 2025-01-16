import React, { useState } from 'react'
import { useNavigate } from '@remix-run/react'
import {
  ArrowPathIcon,
  ArrowPathRoundedSquareIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
// types
import { Job, JobStateStatus, SystemJob } from '~/types/api-job'
// helpers
import { classNames } from '~/helpers/class-helper'
import { formatTime } from '~/helpers/time-helper'
import { formatDateTimeFromTimestamp } from '~/helpers/date-helper'
import { jobCanBeCanceled, jobCanBeRetried } from '~/modules/compute/helpers/status-helper'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
import JobStateBadge from '~/modules/compute/components/badges/JobStateBadge'
// alerts
import AlertInfo from '~/components/alerts/AlertInfo'
import AlertWarning from '~/components/alerts/AlertWarning'
// dialogs
import JobDetailsDialog from '~/modules/compute/components/dialogs/JobDetailsDialog'
import JobCancelDialog from '~/modules/compute/components/dialogs/JobCancelDialog'
// tooltips
import SimpleTooltip from '~/components/tooltips/SimpleTooltip'

const UnavailableSystemAlert: React.FC<any> = ({ unavailableSystemsJobs, className = '' }) => {
  if (!unavailableSystemsJobs || unavailableSystemsJobs.length <= 0) {
    return null
  }
  return (
    <AlertWarning className={classNames('', className)} title='System/s NOT available'>
      <p>The following systems are currently unavailable for interaction:</p>
      <ul className='list-disc list-inside'>
        {unavailableSystemsJobs.map((systemJobs: any, index: number) => (
          <li key={index}>{systemJobs.system.name}</li>
        ))}
      </ul>
      <p className='pt-2'>
        You wan&apos;t be able to view or manage jobs running on these systems at the moment. Please
        check again later or contact support for further assistance.
      </p>
    </AlertWarning>
  )
}

interface JobTableRowProps {
  systemJob: SystemJob
}

enum DisplayField {
  clusterName,
}

interface JobListItemProps {
  job: Job
  hideFields: [DisplayField] | []
}

const mustHideField = (field: DisplayField, hideFields: [DisplayField] | []) => {
  if (!hideFields || hideFields.length == 0 || !hideFields.includes(field)) {
    return false
  }
  return true
}

const JobTableRow: React.FC<JobTableRowProps> = ({ systemJob }: JobTableRowProps) => {
  const navigate = useNavigate()
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const { job, system } = systemJob

  const goToDetails = (jobId: number) => {
    navigate(`/compute/systems/${system.name}/jobs/${jobId}`)
  }

  return (
    <tr className='border-b border-gray-100'>
      <td className='py-3 align-top tabular-nums text-gray-700'>
        <div>
          <JobStateBadge status={job.status} />
        </div>
        <div className='flex items-center text-xs text-gray-500 mb-1'>
          <CalendarIcon aria-hidden='true' className='mr-1 h-4 w-4 flex-shrink-0 text-gray-500' />
          {formatDateTimeFromTimestamp({ timestamp: job.time.submission })}
        </div>
        <div className='flex items-center text-xs text-gray-500'>
          <ClockIcon aria-hidden='true' className='mr-1 h-4 w-4 flex-shrink-0 text-gray-500' />
          {formatTime({ time: job.time.elapsed })}
        </div>
      </td>
      <td className='py-3 align-top tabular-nums text-gray-700'>
        <div className='truncate font-medium text-gray-900 mb-3  text-sm'>{job.name}</div>
        <div className='truncate text-gray-500 text-xs mb-1'>Job Id: {job.jobId}</div>
        <div className='truncate text-gray-500 text-xs'>System: {system.name}</div>
      </td>
      <td className='py-3 align-top tabular-nums text-gray-700'>
        {job.account !== '' ? (
          <LabelBadge color={LabelColor.BLUE}>{job.account}</LabelBadge>
        ) : (
          <LabelBadge color={LabelColor.GRAY}>undefined</LabelBadge>
        )}
      </td>
      <td className='py-3 align-top tabular-nums text-gray-700'>
        {(job.status.state === JobStateStatus.RUNNING ||
          job.status.state === JobStateStatus.COMPLETED) && (
          <>
            <div className='truncate text-gray-500 text-xs mb-1'>Partition: {job.partition}</div>
          </>
        )}
        {job.status.state === 'PENDING' && (
          <>
            <div className='truncate text-gray-500 text-xs mb-1'>
              Pending reason: {job.status.stateReason}
            </div>
          </>
        )}
      </td>
      <td className='py-3 align-top text-right'>
        <JobDetailsDialog
          job={job}
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
        />
        <JobCancelDialog
          job={job}
          system={system}
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
        />
        <span className='isolate inline-flex rounded-md shadow-sm'>
          {/* <SimpleTooltip message={`Show details`} className='right-0 top-9'>
            <button
              onClick={() => setDetailsDialogOpen(true)}
              type='button'
              className='relative inline-flex items-center rounded-l-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10'
            >
              <span className='sr-only'>Show details</span>
              <EyeIcon aria-hidden='true' className='h-5 w-5' />
            </button>
          </SimpleTooltip> */}
          {!jobCanBeRetried(job) && (
            <SimpleTooltip message={`Retry job subission`} className='right-0 top-9'>
              <button
                type='button'
                className='relative -ml-px inline-flex items-center bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10'
              >
                <span className='sr-only'>Retry</span>
                <ArrowPathRoundedSquareIcon className='h-5 w-5' />
              </button>
            </SimpleTooltip>
          )}
          {jobCanBeCanceled(job) && (
            <SimpleTooltip message={`Cancel`} className='right-0 top-9'>
              <button
                onClick={() => setCancelDialogOpen(true)}
                type='button'
                className='relative -ml-px inline-flex items-center bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10'
              >
                <span className='sr-only'>Cancel</span>
                <XMarkIcon aria-hidden='true' className='h-5 w-5' />
              </button>
            </SimpleTooltip>
          )}
          <SimpleTooltip message={`Go to details`} className='right-0 top-9'>
            <button
              onClick={() => goToDetails(job.jobId)}
              type='button'
              className='relative -ml-px inline-flex items-center rounded-r-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10'
            >
              <span className='sr-only'>Go to details</span>
              <ArrowRightIcon aria-hidden='true' className='h-5 w-5' />
            </button>
          </SimpleTooltip>
        </span>
      </td>
    </tr>
  )
}

const JobsTable: React.FC<any> = ({ systemsJobs }: any) => {
  if (systemsJobs.length <= 0) {
    return <AlertInfo message='Job/s not found' />
  }
  return (
    <table className='w-full whitespace-nowrap text-left text-sm leading-6'>
      <colgroup>
        <col className='lg:w-3/12' />
        <col className='lg:w-3/12' />
        <col className='lg:w-3/12' />
        <col className='lg:w-3/12' />
        <col className='lg:w-3/12' />
      </colgroup>
      <thead className='border-b border-gray-200 text-gray-900'>
        <tr>
          <th scope='col' className='px-0 py-3 font-semibold'>
            Status
          </th>
          <th scope='col' className='px-0 py-3 font-semibold'>
            Job
          </th>
          <th scope='col' className='px-0 py-3 font-semibold'>
            Account
          </th>
          <th scope='col' className='px-0 py-3 font-semibold'>
            Info
          </th>
          <th scope='col' className='px-0 py-3 font-semibold'></th>
        </tr>
      </thead>
      <tbody>
        {systemsJobs.map((systemJob: SystemJob) => (
          <JobTableRow
            key={`${systemJob.system.name}-${systemJob.job.jobId}`}
            systemJob={systemJob}
          />
        ))}
      </tbody>
    </table>
  )
}

const SystemJobList: React.FC<any> = ({ systemsJobs }) => {
  const unavailableSystemsJobs = systemsJobs.filter((systemJob: any) => {
    return systemJob.error !== undefined
  })
  const listOfSystemJob = systemsJobs
    .filter((systemJobs: any) => {
      return !systemJobs.error || systemJobs.error === null
    })
    .flatMap((systemJobs: any) => {
      if (systemJobs.jobs === null) {
        return []
      }
      return systemJobs.jobs.map((job: any) => ({
        system: systemJobs.system,
        job: job,
      }))
    })
    .sort((a: any, b: any) => b.job.time.submission - a.job.time.submission)
  return (
    <>
      <UnavailableSystemAlert unavailableSystemsJobs={unavailableSystemsJobs} className='mb-6' />
      <JobsTable systemsJobs={listOfSystemJob} />
    </>
  )
}

export default SystemJobList
