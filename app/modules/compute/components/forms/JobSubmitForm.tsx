/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useState, useRef, useEffect } from 'react'
import { ChevronRightIcon, ChevronDownIcon, FolderOpenIcon } from '@heroicons/react/20/solid'
import { useSubmit, useFetcher } from '@remix-run/react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
// helpers
import { classNames } from '~/helpers/class-helper'
import { getFormErrorFieldsFromError } from '~/helpers/error-helper'
import { isSystemHealthyByServiceType, getHealthySchedulerSystems } from '~/helpers/system-helper'

// buttons
import LoadingButton from '~/components/buttons/LoadingButton'
// types
import { type System, type FileSystem, ServiceType } from '~/types/api-status'
// forms
import {
  hasErrorForField,
  showInputValidation,
} from '~/components/forms/validations/ValidationForm'
import SingleDraggableFileUpload from '~/components/forms/files/SingleDraggableFileUpload'
// browsers
import RemoteFilesystemBrowser, {
  RemoteFilesystemBrowserMode,
} from '~/modules/filesystem/components/browsers/RemoteFilesystemBrowser'
// overlays
import BaseSlideOver from '~/components/overlays/BaseSliderOver'

interface FormData {
  systems: [System]
  username: string
  accountName: string
  systemName: string
}

interface JobSubmitFormData {
  formData: FormData
  formError: any
}

const JobSubmitForm: React.FC<any> = ({ formData, formError }: JobSubmitFormData) => {
  // TODO: File upload check if could be improved
  const singleDraggableFileUploadRef = useRef<any>(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const submit = useSubmit()
  const formRef = useRef<any>()
  const [file, setFile] = useState<any>(null)
  const [scriptMode, setScriptMode] = useState<'local' | 'remote'>('local')
  const [isOpenTargetBrowse, setIsOpenTargetBrowse] = useState(false)
  const [isOpenRemoteScriptBrowse, setIsOpenRemoteScriptBrowse] = useState(false)
  const [loading, setLoading] = useState(false)
  const partitionsFetcher = useFetcher<{ partitions: { name: string }[] }>()
  const reservationsFetcher = useFetcher<{ reservations: { name: string }[] }>()
  const { systems, username, systemName, accountName } = formData
  const formErrorFields = getFormErrorFieldsFromError(formError)
  const [formValues, setFormValues] = useState({
    system: systemName,
    account: accountName,
    workingDirectory: '',
    remoteScript: '',
    standardInput: '',
    standardOutput: '',
    standardError: '',
    environment: '',
    reservation: '',
    partition: '',
  })

  useEffect(() => {
    if (formValues.system) {
      const healthySystems = getHealthySchedulerSystems(systems)
      const system = healthySystems.find((system: System) => system.name == formValues.system)
      const homeDirs = system?.fileSystems.filter((fileSystem: FileSystem) => {
        return fileSystem.defaultWorkDir
      })
      if (homeDirs && homeDirs.length > 0) {
        const homeDir: FileSystem = homeDirs[0]
        const homeDirPath = `${homeDir.path}/${username}/`
        setFormValues({ ...formValues, workingDirectory: homeDirPath, system: formValues.system })
      } else {
        setFormValues({ ...formValues, system: formValues.system })
      }
    }
  }, [])

  useEffect(() => {
    if (formError) {
      setLoading(false)
    }
  }, [formError])

  useEffect(() => {
    if (formValues.system) {
      partitionsFetcher.load(`/api/status/${formValues.system}/partitions`)
      reservationsFetcher.load(`/api/status/${formValues.system}/reservations`)
    }
  }, [formValues.system])

  const handleOnSubmit = (event: any) => {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(formRef.current)
    if (file && file !== null) {
      formData.set('file', file)
    }
    submit(formData, { method: 'post', encType: 'multipart/form-data' })
  }

  const handleFileSelected = (file: any) => {
    setFile(file)
  }

  const handlReset = () => {
    setFile(null)
    setScriptMode('local')
    setFormValues({
      ...formValues,
      system: systemName,
      account: accountName,
      workingDirectory: '',
      remoteScript: '',
      standardInput: '',
      standardOutput: '',
      standardError: '',
      environment: '',
      reservation: '',
      partition: '',
    })
    if (singleDraggableFileUploadRef.current) {
      singleDraggableFileUploadRef.current.reset()
    }
  }

  const handleOnTargetBrowse = () => {
    setIsOpenTargetBrowse(true)
  }

  const handleOnBrowseTargetSelection = (systemName: string, targetPath: string) => {
    setFormValues({ ...formValues, workingDirectory: targetPath, system: systemName })
    setIsOpenTargetBrowse(false)
  }

  const handleOnRemoteScriptBrowse = () => {
    setIsOpenRemoteScriptBrowse(true)
  }

  const handleOnBrowseRemoteScriptSelection = (_systemName: string, targetPath: string) => {
    setFormValues({ ...formValues, remoteScript: targetPath })
    setIsOpenRemoteScriptBrowse(false)
  }

  return (
    <form ref={formRef} onSubmit={handleOnSubmit} className='relative'>
      <BaseSlideOver
        isOpen={isOpenTargetBrowse}
        setIsOpen={setIsOpenTargetBrowse}
        title={'Browse remote filesystem'}
        subtitle={'Navigate the remote file system and select the target path'}
      >
        <RemoteFilesystemBrowser
          initCurrentPath={formValues.workingDirectory}
          initSystemName={formValues.system}
          onBrowseSelection={handleOnBrowseTargetSelection}
          mode={RemoteFilesystemBrowserMode.DIRECTORY}
        />
      </BaseSlideOver>
      <BaseSlideOver
        isOpen={isOpenRemoteScriptBrowse}
        setIsOpen={setIsOpenRemoteScriptBrowse}
        title={'Browse remote filesystem'}
        subtitle={'Navigate the remote file system and select the script file'}
      >
        <RemoteFilesystemBrowser
          initCurrentPath={formValues.remoteScript || formValues.workingDirectory}
          initSystemName={formValues.system}
          onBrowseSelection={handleOnBrowseRemoteScriptSelection}
          mode={RemoteFilesystemBrowserMode.FILE}
        />
      </BaseSlideOver>
      <div className='sm:overflow-hidden'>
        <div>
          <div className='grid grid-cols-6 gap-6'>
            <div className='col-span-6 sm:col-span-6'>
              <div className='border-b border-gray-200 mb-3'>
                <nav className='-mb-px flex space-x-8'>
                  <button
                    type='button'
                    onClick={() => setScriptMode('local')}
                    className={classNames(
                      'whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium transition-colors',
                      scriptMode === 'local'
                        ? 'border-gray-800 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    )}
                  >
                    Upload local script
                  </button>
                  <button
                    type='button'
                    onClick={() => setScriptMode('remote')}
                    className={classNames(
                      'whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium transition-colors',
                      scriptMode === 'remote'
                        ? 'border-gray-800 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    )}
                  >
                    Use remote script
                  </button>
                </nav>
              </div>
              <input type='hidden' name='scriptMode' value={scriptMode} />
              <input type='hidden' name='system' value={formValues.system} />
              <input type='hidden' name='account' value={formValues.account} />
              {scriptMode === 'local' && (
                <>
                  <SingleDraggableFileUpload
                    ref={singleDraggableFileUploadRef}
                    onFileSelected={handleFileSelected}
                    fieldError={hasErrorForField({
                      fieldName: 'file',
                      formErrorFields: formErrorFields,
                    })}
                  />
                  {showInputValidation({
                    fieldName: 'file',
                    formErrorFields: formErrorFields,
                  })}
                </>
              )}
              {scriptMode === 'remote' && (
                <>
                  <div className='flex rounded-md shadow-sm'>
                    <div className='relative flex flex-grow items-stretch focus-within:z-10'>
                      <input
                        type='text'
                        name='remoteScript'
                        value={formValues.remoteScript}
                        onChange={(e) =>
                          setFormValues({ ...formValues, remoteScript: e.target.value })
                        }
                        className={classNames(
                          hasErrorForField({
                            fieldName: 'remoteScript',
                            formErrorFields: formErrorFields,
                          })
                            ? 'border-red-300 focus:border-red-300 focus:ring-red-300'
                            : 'border-gray-300 focus:border-blue-300 focus:ring-blue-300',
                          'block w-full rounded-l-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none',
                        )}
                        placeholder='/path/to/your/job.sh'
                      />
                    </div>
                    <button
                      type='button'
                      onClick={handleOnRemoteScriptBrowse}
                      className='relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                    >
                      <FolderOpenIcon className='-ml-0.5 h-5 w-5 text-gray-400' aria-hidden='true' />
                      Browse remote filesystem
                    </button>
                  </div>
                  {showInputValidation({
                    fieldName: 'remoteScript',
                    formErrorFields: formErrorFields,
                  })}
                </>
              )}
        </div>
            <div className='col-span-6 sm:col-span-2'>
              <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                Job Name
              </label>
              <input
                type='text'
                name='name'
                className='border-gray-300 focus:border-blue-300 focus:ring-blue-300 mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none'
              />
              {showInputValidation({
                fieldName: 'name',
                formErrorFields: formErrorFields,
              })}

            </div>
            
            <div className='col-span-6 sm:col-span-6'>
              <label htmlFor='workingDirectory' className='block text-sm font-medium text-gray-700'>
                Working directory <span className='italic text-red-400'>*</span>
              </label>
              <div className='flex mt-1 rounded-md shadow-sm'>
                <div className='relative flex flex-grow items-stretch focus-within:z-10'>
                  <input
                    type='text'
                    name='workingDirectory'
                    value={formValues.workingDirectory}
                    onChange={(e) =>
                      setFormValues({ ...formValues, workingDirectory: e.target.value })
                    }
                    className={classNames(
                      formValues.system != ''
                        ? ''
                        : 'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200',
                      'border-gray-300 focus:border-blue-300 focus:ring-blue-300',
                      'block w-full rounded-l-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none',
                    )}
                    placeholder='/home/<my-directory>'
                    disabled={formValues.system != '' ? false : true}
                  />
                  {showInputValidation({
                    fieldName: 'working_directory',
                    formErrorFields: formErrorFields,
                  })}
                </div>
                <button
                  type='button'
                  onClick={handleOnTargetBrowse}
                  className={classNames(
                    'relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50',
                  )}
                >
                  <FolderOpenIcon className='-ml-0.5 h-5 w-5 text-gray-400' aria-hidden='true' />
                  Browse remote filesystem
                </button>
              </div>
            </div>
            
            <div className='col-span-6 sm:col-span-6'>
              <div className='text-sm'>
                <button
                  type='button'
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className='flex font-medium text-gray-600 space-x-2'
                >
                  <div>
                    {showAdvancedOptions ? (
                      <ChevronDownIcon aria-hidden='true' className='-ml-0.5 h-5 w-5' />
                    ) : (
                      <ChevronRightIcon aria-hidden='true' className='-ml-0.5 h-5 w-5' />
                    )}
                  </div>
                  <div>
                    {' '}
                    {showAdvancedOptions ? 'Hide advanced options' : 'Show advanced options (optional)'}
                  </div>
                </button>
              </div>
            </div>
            {showAdvancedOptions && (
              <>
                <div className='col-span-6 sm:col-span-3'>
                  <label htmlFor='partition' className='block text-sm font-medium text-gray-700'>
                    Partition
                  </label>
                  <select
                    name='partition'
                    value={formValues.partition}
                    onChange={(e) => setFormValues({ ...formValues, partition: e.target.value })}
                    disabled={
                      partitionsFetcher.state === 'loading' ||
                      (partitionsFetcher.data !== undefined &&
                        (partitionsFetcher.data?.partitions ?? []).length === 0)
                    }
                    className='border-gray-300 focus:border-blue-300 focus:ring-blue-300 mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500'
                  >
                    <option value=''>
                      {partitionsFetcher.state === 'loading'
                        ? 'Loading…'
                        : partitionsFetcher.data !== undefined &&
                            (partitionsFetcher.data?.partitions ?? []).length === 0
                          ? 'No partitions available'
                          : 'Select a partition'}
                    </option>
                    {(partitionsFetcher.data?.partitions ?? []).map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {showInputValidation({
                    fieldName: 'partition',
                    formErrorFields: formErrorFields,
                  })}
                </div>
                <div className='col-span-6 sm:col-span-3'>
                  <label htmlFor='reservation' className='block text-sm font-medium text-gray-700'>
                    Reservation
                  </label>
                  <select
                    name='reservation'
                    value={formValues.reservation}
                    onChange={(e) => setFormValues({ ...formValues, reservation: e.target.value })}
                    disabled={
                      reservationsFetcher.state === 'loading' ||
                      (reservationsFetcher.data !== undefined &&
                        (reservationsFetcher.data?.reservations ?? []).length === 0)
                    }
                    className='border-gray-300 focus:border-blue-300 focus:ring-blue-300 mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500'
                  >
                    <option value=''>
                      {reservationsFetcher.state === 'loading'
                        ? 'Loading…'
                        : reservationsFetcher.data !== undefined &&
                            (reservationsFetcher.data?.reservations ?? []).length === 0
                          ? 'No reservations available'
                          : 'Select a reservation'}
                    </option>
                    {(reservationsFetcher.data?.reservations ?? []).map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  {showInputValidation({
                    fieldName: 'reservation',
                    formErrorFields: formErrorFields,
                  })}
                </div>
                <div className='col-span-6 sm:col-span-2'>
                  <label
                    htmlFor='standardInput'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Standard input file path
                  </label>
                  <input
                    type='text'
                    name='standardInput'
                    value={formValues.standardInput}
                    onChange={(e) =>
                      setFormValues({ ...formValues, standardInput: e.target.value })
                    }
                    className='border-gray-300 focus:border-blue-300 focus:ring-blue-300 mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none'
                    placeholder=''
                  />
                  {showInputValidation({
                    fieldName: 'standardInput',
                    formErrorFields: formErrorFields,
                  })}
                </div>
                <div className='col-span-6 sm:col-span-2'>
                  <label
                    htmlFor='standardOutput'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Standard output file path
                  </label>
                  <input
                    type='text'
                    name='standardOutput'
                    value={formValues.standardOutput}
                    onChange={(e) =>
                      setFormValues({ ...formValues, standardOutput: e.target.value })
                    }
                    className='border-gray-300 focus:border-blue-300 focus:ring-blue-300 mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none'
                    placeholder=''
                  />
                  {showInputValidation({
                    fieldName: 'standardOutput',
                    formErrorFields: formErrorFields,
                  })}
                </div>
                <div className='col-span-6 sm:col-span-2'>
                  <label
                    htmlFor='standardError'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Standard error file path
                  </label>
                  <input
                    type='text'
                    name='standardError'
                    value={formValues.standardError}
                    onChange={(e) =>
                      setFormValues({ ...formValues, standardError: e.target.value })
                    }
                    className='border-gray-300 focus:border-blue-300 focus:ring-blue-300 mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none'
                    placeholder=''
                  />
                  {showInputValidation({
                    fieldName: 'standardError',
                    formErrorFields: formErrorFields,
                  })}
                </div>
                <div className='col-span-6'>
                  <label htmlFor='environment' className='block text-sm font-medium text-gray-700'>
                    Environment variables (JSON format)
                  </label>
                  <textarea
                    name='environment'
                    value={formValues.environment}
                    onChange={(e) => setFormValues({ ...formValues, environment: e.target.value })}
                    className='border-gray-300 focus:border-blue-300 focus:ring-blue-300 mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none'
                    placeholder='Example: {"PATH": "/bin:/usr/bin/:/usr/local/bin/"}'
                  />
                  {showInputValidation({
                    fieldName: 'environment',
                    formErrorFields: formErrorFields,
                  })}
                </div>
              </>
            )}
          </div>
        </div>
        <div className='flex items-center justify-end bg-gray-50 mt-6 px-4 py-3 text-right sm:px-6'>
          <button
            type='button'
            className={classNames(
              !loading ? '' : 'opacity-50 cursor-not-allowed',
              'mr-2 inline-flex justify-center rounded-md border border-transparent bg-gray-800 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2',
            )}
            disabled={loading}
            onClick={handlReset}
          >
            Reset
          </button>
          <LoadingButton isLoading={loading} className='sm:w-auto sm:text-sm'>
            <button
              type='submit'
              className={classNames(
                !loading ? '' : 'opacity-50 cursor-not-allowed',
                'inline-flex justify-center rounded-md border border-transparent bg-emerald-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2',
              )}
              disabled={loading}
            >
              Submit
            </button>
          </LoadingButton>
        </div>
      </div>
    </form>
  )
}

export default JobSubmitForm
