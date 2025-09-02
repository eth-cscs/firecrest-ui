/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from '@remix-run/react'
import { ArrowPathIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
// types
import { System } from '~/types/api-status'
import { GetOpsTailResponse } from '~/types/api-filesystem'
import { GetJobResponse, Job, JobMetadata, JobStateStatus } from '~/types/api-job'
// helpers
import { formatTime } from '~/helpers/time-helper'
import { formatDateTimeFromTimestamp } from '~/helpers/date-helper'
// views
import SimpleView, { SimpleViewSize } from '~/components/views/SimpleView'
// panels
import SimplePanel from '~/components/panels/SimplePanel'
// alerts
import AlertError from '~/components/alerts/AlertError'
// tabs
import { UnderlineTabPanel, UnderlineTabs } from '~/components/tabs/UnderlineTabs'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
import JobStateBadge from '~/modules/compute/components/badges/JobStateBadge'
// dialogs
import JobCancelDialog from '~/modules/compute/components/dialogs/JobCancelDialog'
// apis
import { getLocalOpsTail } from '~/apis/filesystem-api'
// cards
import LeftTitleCard from '~/components/cards/LeftTitleCard'
// lists
import { AttributesList, AttributesListItem } from '~/components/lists/AttributesList'
import { getLocalJob } from '~/apis/compute-api'
import { jobCanBeCanceled } from '../../helpers/status-helper'

interface JobDetailsViewProps {
  jobs: Job[]
  jobsMetadata: JobMetadata[]
  system: System
  error: any
  dashboard: string | null
}

interface ConsoleOutputProps {
  output: string
}

const ConsoleOutput: React.FC<ConsoleOutputProps> = ({ output }: ConsoleOutputProps) => {
  const divRef = useRef(null)

  useEffect(() => {
    const div = divRef.current
    if (div) {
      // Scorri fino al fondo del div
      div.scrollTop = div.scrollHeight
    }
  }, [output])

  return (
    <div
      ref={divRef}
      className='bg-black text-xs text-white p-4 rounded-lg font-mono whitespace-pre-wrap overflow-auto h-80'
    >
      <pre className='m-0'>{output}</pre>
    </div>
  )
}

const JobDetailsView: React.FC<JobDetailsViewProps> = ({
  jobs,
  jobsMetadata,
  system,
  error,
  dashboard,
}: JobDetailsViewProps) => {
  const job = useMemo<Job | null>(() => (jobs && jobs.length > 0 ? jobs[0] : null), [jobs])
  const jobMetadata = useMemo<JobMetadata | null>(
    () => (jobsMetadata && jobsMetadata.length > 0 ? jobsMetadata[0] : null),
    [jobsMetadata],
  )
  const [currentJob, setCurrentJob] = useState<Job | null>(() => job)
  const [syncStandardOut, setSyncStandardOut] = useState<boolean>(true)
  const [jobStandardOuput, setJobStandardOuput] = useState<GetOpsTailResponse | null>(null)
  const [syncStandardError, setSyncStandardError] = useState<boolean>(true)
  const [jobStandardError, setJobStandardError] = useState<GetOpsTailResponse | null>(null)
  const [localError, setLocalError] = useState<any>(error)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const navigate = useNavigate()

  const fetchJob = async (jobId: number, setter: React.Dispatch<React.SetStateAction<Job>>) => {
    try {
      const response: GetJobResponse = await getLocalJob(system.name, jobId)
      const [job] = response.jobs
      setter(job)
    } catch (error) {
      setLocalError(error)
    }
  }

  const fetchJobFileContent = async (
    filePath: string,
    setter: React.Dispatch<React.SetStateAction<GetOpsTailResponse | null>>,
  ) => {
    try {
      const response: GetOpsTailResponse = await getLocalOpsTail(system.name, filePath, '100')
      setter(response)
    } catch (error) {
      setLocalError(error)
    }
  }

  const fetchJobStandardFileContent = (jobMetadata: JobMetadata) => {
    if (
      // syncStandardOut &&
      jobMetadata.standardOutput !== null &&
      jobMetadata.standardOutput !== ''
    ) {
      fetchJobFileContent(jobMetadata.standardOutput, setJobStandardOuput)
    }
    if (
      // syncStandardError &&
      jobMetadata.standardError !== null &&
      jobMetadata.standardError !== ''
    ) {
      fetchJobFileContent(jobMetadata.standardError, setJobStandardError)
    }
  }

  useEffect(() => {
    setCurrentJob(job ?? null)
    if (currentJob !== null) {
      const currentJobStateStatus = currentJob.status.state
      const fecthJobAndJobStandardFileContent = (jobStateStatus: JobStateStatus) => {
        fetchJob(currentJob.jobId, setCurrentJob)
        if (jobMetadata && jobMetadata !== null) {
          // Get job standard output/s
          if (![JobStateStatus.PENDING].includes(jobStateStatus)) {
            fetchJobStandardFileContent(jobMetadata)
          }
        }
      }
      fecthJobAndJobStandardFileContent(currentJobStateStatus)
      if (![JobStateStatus.COMPLETED, JobStateStatus.FAILED].includes(currentJobStateStatus)) {
        const intervalId = setInterval(
          () => fecthJobAndJobStandardFileContent(currentJobStateStatus),
          2000,
        )
        return () => clearInterval(intervalId)
      }
    }
  }, [job])

  useEffect(() => {
    setLocalError(error ?? null)
  }, [error])

  const handleClickReload = () => {
    window.location.reload()
  }

  const handleNavigateBack = () => {
    navigate('/compute')
  }

  const getActionButtons = () => {
    return (
      <div className='flex gap-2'>
        <button
          onClick={handleNavigateBack}
          className='cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
        >
          <ArrowLeftIcon className='-ml-1 mr-2 h-5 w-5 text-gray-500' aria-hidden='true' />
          Back to the job list
        </button>
        <button
          onClick={handleClickReload}
          className='cursor-pointer inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
        >
          <ArrowPathIcon className='-ml-1 mr-2 h-5 w-5 text-green-500' aria-hidden='true' />
          Reload
        </button>
        {currentJob && jobCanBeCanceled(currentJob) && (
          <button
            onClick={() => setCancelDialogOpen(true)}
            className='cursor-pointer inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
          >
            <TrashIcon className='-ml-1 mr-2 h-5 w-5 text-red-500' aria-hidden='true' />
            Cancel
          </button>
        )}
      </div>
    )
  }

  if (!currentJob) {
    return (
      <div className='p-4 text-sm text-gray-600'>
        {localError ? 'Failed to load job.' : 'Loading job details…'}
      </div>
    )
  }

  return (
    <SimpleView size={SimpleViewSize.FULL} className='mb-4'>
      <SimplePanel title='Job details' className='mb-4' actionsButtons={getActionButtons()}>
        <>
          <AlertError error={localError} />
          <JobCancelDialog
            job={currentJob}
            system={system}
            open={cancelDialogOpen}
            onClose={() => setCancelDialogOpen(false)}
          />
          <LeftTitleCard
            title='Job identification data'
            subtitle='This section contains information that identifies the job, including its unique ID, name, user, and status'
            className='mb-8 border-b border-gray-900/10'
          >
            <AttributesList>
              <AttributesListItem label='Job ID'>#{currentJob.jobId}</AttributesListItem>
              <AttributesListItem label='Name'>{currentJob.name}</AttributesListItem>
              <AttributesListItem label='Status'>
                <JobStateBadge status={currentJob.status} />
              </AttributesListItem>
              <AttributesListItem label='Submitted by'>
                <LabelBadge color={LabelColor.BLUE}>{currentJob.user}</LabelBadge>
              </AttributesListItem>
              <AttributesListItem label='Account'>
                {currentJob?.account !== '' ? (
                  <LabelBadge color={LabelColor.BLUE}>{currentJob.account}</LabelBadge>
                ) : (
                  <LabelBadge color={LabelColor.GRAY}>undefined</LabelBadge>
                )}{' '}
              </AttributesListItem>
            </AttributesList>
          </LeftTitleCard>
          <LeftTitleCard
            title='Execution times'
            subtitle='This section provides the time-related details of the job execution, including start and end times, and the total execution duration'
            className='mb-8 border-b border-gray-900/10'
          >
            <AttributesList>
              <AttributesListItem label='Start time'>
                {formatDateTimeFromTimestamp({ timestamp: currentJob.time.start })}
              </AttributesListItem>
              <AttributesListItem label='End time'>
                {formatDateTimeFromTimestamp({ timestamp: currentJob.time.end })}
              </AttributesListItem>
              <AttributesListItem label='Execution time'>
                {formatTime({ time: currentJob.time.elapsed })}
              </AttributesListItem>
            </AttributesList>
          </LeftTitleCard>
          <LeftTitleCard
            title='System and resource details'
            subtitle='This section covers the system and resources allocated to the job, including the system name, cluster, nodes, and working environment'
          >
            <AttributesList>
              <AttributesListItem label='System name'>
                <LabelBadge color={LabelColor.YELLOW}>{system.name}</LabelBadge>
              </AttributesListItem>
              <AttributesListItem label='Cluster'>
                <LabelBadge color={LabelColor.YELLOW}>{currentJob.cluster}</LabelBadge>
              </AttributesListItem>
              <AttributesListItem label='Nodes'>{currentJob.nodes}</AttributesListItem>
              <AttributesListItem label='Partition'>{currentJob.partition}</AttributesListItem>
              <AttributesListItem label='Working directory'>
                {currentJob.workingDirectory}
              </AttributesListItem>
            </AttributesList>
          </LeftTitleCard>
          {jobMetadata !== undefined && jobMetadata !== null && (
            <div className='border-t border-gray-900/10 mt-5 pt-5'>
              <UnderlineTabs>
                <UnderlineTabPanel label='Script'>
                  <ConsoleOutput output={jobMetadata.script || ''} />
                </UnderlineTabPanel>
                <UnderlineTabPanel label='Standard input'>
                  <ConsoleOutput output={jobMetadata.standardInput || ''} />
                </UnderlineTabPanel>
                {jobMetadata.standardOutput !== jobMetadata.standardError ? (
                  <>
                    <UnderlineTabPanel label='Standard output'>
                      <ConsoleOutput output={jobStandardOuput?.output?.content || '...'} />
                    </UnderlineTabPanel>
                    <UnderlineTabPanel label='Standard error'>
                      <ConsoleOutput output={jobStandardError?.output?.content || '...'} />
                    </UnderlineTabPanel>
                  </>
                ) : (
                  <UnderlineTabPanel label='Standard output'>
                    <ConsoleOutput output={jobStandardOuput?.output?.content || '...'} />
                  </UnderlineTabPanel>
                )}
                {typeof dashboard === 'string' && dashboard.trim() !== '' ? (
                  <UnderlineTabPanel label='Observability'>
                    <iframe
                      src={dashboard}
                      width='800'
                      height='600'
                      title='Observability'
                      loading='lazy'
                    />
                  </UnderlineTabPanel>
                ) : null}
              </UnderlineTabs>
            </div>
          )}
        </>
      </SimplePanel>
    </SimpleView>
  )
}

export default JobDetailsView
