/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useState, useRef, useEffect } from 'react'
import { ChevronRightIcon, ChevronDownIcon, FolderOpenIcon } from '@heroicons/react/20/solid'
import { useSubmit } from '@remix-run/react'
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
}

interface JobSubmitForm {
  formData: FormData
  formError: any
}

const JobSubmitForm: React.FC<any> = ({ formData, formError }: JobSubmitForm) => {
  // TODO: File upload check if could be improved
  const singleDraggableFileUploadRef = useRef<any>(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const submit = useSubmit()
  const formRef = useRef<any>()
  const [file, setFile] = useState<any>(null)
  const [isOpenTargetBrowse, setIsOpenTargetBrowse] = useState(false)
  const [loading, setLoading] = useState(false)
  const { systems, username } = formData
  const formErrorFields = getFormErrorFieldsFromError(formError)
  const [formValues, setFormValues] = useState({
    system: '',
    workingDirectory: '',
    // advanced options
    standardInput: '',
    standardOutput: '',
    standardError: '',
    environment: '',
  })

  useEffect(() => {
    if (formValues.system == '') {
      const healthySystems = getHealthySchedulerSystems(systems)
      if (healthySystems && healthySystems.length > 0) {
        handleSystemChanged(healthySystems[0].name)
      }
    }
  }, [])

  useEffect(() => {
    if (formError) {
      setLoading(false)
    }
  }, [formError])

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

  const handleSystemChanged = (systemName: any) => {
    if (systemName === '') {
      setFormValues({ ...formValues, workingDirectory: '', system: '' })
    } else {
      const system = systems.find((system: System) => system.name == systemName)
      const homeDirs = system?.fileSystems.filter((fileSystem: FileSystem) => {
        return fileSystem.defaultWorkDir
      })
      if (homeDirs && homeDirs.length > 0) {
        const homeDir: FileSystem = homeDirs[0]
        const homeDirPath = `${homeDir.path}/${username}/`
        setFormValues({ ...formValues, workingDirectory: homeDirPath, system: systemName })
      } else {
        setFormValues({ ...formValues, system: systemName })
      }
    }
  }

  const handlReset = () => {
    setFile(null)
    setFormValues({
      ...formValues,
      system: '',
      workingDirectory: '',
      standardInput: '',
      standardOutput: '',
      standardError: '',
      environment: '',
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
      <div className='sm:overflow-hidden'>
        <div>
          {/* <div className='mb-6'>
            <h2 className='text-lg font-medium leading-6 text-gray-900'>Project details</h2>
            <p className='mt-1 text-sm text-gray-500'>Fill the form to proceed with ...</p>
          </div> */}
          <div className='grid grid-cols-6 gap-6'>
            <div className='col-span-6 sm:col-span-2'>
              <label htmlFor='system' className='block text-sm font-medium text-gray-700'>
                System <span className='italic text-red-400'>*</span>
              </label>
              <select
                name='system'
                className={classNames(
                  hasErrorForField({
                    fieldName: 'system',
                    formErrorFields: formErrorFields,
                  })
                    ? 'border-red-300 focus:border-red-300 focus:ring-red-300'
                    : 'border-gray-300 focus:border-blue-300 focus:ring-blue-300',
                  'mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none ',
                )}
                value={formValues.system}
                onChange={(e) => handleSystemChanged(e.target.value)}
              >
                <option value=''>Please select a system...</option>
                {systems &&
                  systems.length > 0 &&
                  systems.map((system: any) => (
                    <option
                      key={system.name}
                      value={system.name}
                      disabled={!isSystemHealthyByServiceType(system, ServiceType.scheduler)}
                    >
                      {system.name} ({system.ssh.host}){' '}
                      {`${isSystemHealthyByServiceType(system, ServiceType.scheduler) ? '' : ' - unhealthy'}`}
                    </option>
                  ))}
              </select>
              {showInputValidation({
                fieldName: 'system',
                formErrorFields: formErrorFields,
              })}
            </div>
            <div className='col-span-6 sm:col-span-2'>
              <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                Account
              </label>
              <input
                type='text'
                name='account'
                className='border-gray-300 focus:border-blue-300 focus:ring-blue-300 mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none'
              />
              {showInputValidation({
                fieldName: 'name',
                formErrorFields: formErrorFields,
              })}
              <div className='flex mt-1'>
                <div className='flex-shrink-0'>
                  <InformationCircleIcon className='text-blue-400 h-5 w-5' />
                </div>
                <div className='ml-1 text-xs text-blue-400'>
                  Charge job resources to specified account
                </div>
              </div>
            </div>
            <div className='col-span-6 sm:col-span-2'>
              <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                Name
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
              <div className='flex mt-1'>
                <div className='flex-shrink-0'>
                  <InformationCircleIcon className='text-blue-400 h-5 w-5' />
                </div>
                <div className='ml-1 text-xs text-blue-400'>
                  Name of the job, if not set, the name of the sbatch file is taken.
                </div>
              </div>
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
              <label htmlFor='sbatchFile' className='block text-sm font-medium text-gray-700'>
                SBATCH script file to be submitted to SLURM{' '}
                <span className='italic text-red-400'>*</span>
              </label>
              <SingleDraggableFileUpload
                ref={singleDraggableFileUploadRef}
                onFileSelected={handleFileSelected}
                fieldError={hasErrorForField({
                  fieldName: 'system',
                  formErrorFields: formErrorFields,
                })}
              />
              {showInputValidation({
                fieldName: 'file',
                formErrorFields: formErrorFields,
              })}
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
                    {showAdvancedOptions ? 'Hide advanced options' : 'Show advanced options'}
                  </div>
                </button>
              </div>
            </div>
            {showAdvancedOptions && (
              <>
                <div className='col-span-6 sm:col-span-2'>
                  <label
                    htmlFor='standardInput'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Standard input
                  </label>
                  <input
                    type='text'
                    name='standardInput'
                    value={formValues.standardInput}
                    onChange={(e) =>
                      setFormValues({ ...formValues, standardInput: e.target.value })
                    }
                    className='border-gray-300 focus:border-blue-300 focus:ring-blue-300 mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none'
                    placeholder='/dev/null'
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
                    Standard output
                  </label>
                  <input
                    type='text'
                    name='standardOutput'
                    value={formValues.standardOutput}
                    onChange={(e) =>
                      setFormValues({ ...formValues, standardOutput: e.target.value })
                    }
                    className='border-gray-300 focus:border-blue-300 focus:ring-blue-300 mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none'
                    placeholder='/home/<my-directory>/<my-output-file>.out'
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
                    Standard error
                  </label>
                  <input
                    type='text'
                    name='standardError'
                    value={formValues.standardError}
                    onChange={(e) =>
                      setFormValues({ ...formValues, standardError: e.target.value })
                    }
                    className='border-gray-300 focus:border-blue-300 focus:ring-blue-300 mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none'
                    placeholder='/home/<my-directory>/<my-error-file>.out'
                  />
                  {showInputValidation({
                    fieldName: 'standardError',
                    formErrorFields: formErrorFields,
                  })}
                </div>
                <div className='col-span-6'>
                  <label htmlFor='environment' className='block text-sm font-medium text-gray-700'>
                    Environment
                  </label>
                  <textarea
                    name='environment'
                    value={formValues.environment}
                    onChange={(e) => setFormValues({ ...formValues, environment: e.target.value })}
                    className='border-gray-300 focus:border-blue-300 focus:ring-blue-300 mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none'
                    placeholder='{"PATH": "/bin:/usr/bin/:/usr/local/bin/"}'
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
