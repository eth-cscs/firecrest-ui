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
import { Job, JobMetadata } from '~/types/api-job'
// helpers
import { formatTime } from '~/helpers/time-helper'
import { formatDateTimeFromTimestamp } from '~/helpers/date-helper'
import { jobCanBeCanceled } from '~/modules/compute/helpers/status-helper'
// views
import SimpleView, { SimpleViewSize } from '~/components/views/SimpleView'
// panels
import SimplePanel from '~/components/panels/SimplePanel'
// alerts
import AlertError from '~/components/alerts/AlertError'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
import JobStateBadge from '~/modules/compute/components/badges/JobStateBadge'
// dialogs
import JobCancelDialog from '~/modules/compute/components/dialogs/JobCancelDialog'
// cards
import LeftTitleCard from '~/components/cards/LeftTitleCard'
// lists
import { AttributesList, AttributesListItem } from '~/components/lists/AttributesList'

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
  const [localError, setLocalError] = useState<any>(error)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const navigate = useNavigate()

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
        </>
      </SimplePanel>
    </SimpleView>
  )
}

export default JobDetailsView
