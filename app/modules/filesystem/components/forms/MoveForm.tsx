import React, { useState } from 'react'
import { FolderOpenIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
// types
import { GetTransferMvResponse } from '~/types/api-filesystem'
// helpers
import { classNames } from '~/helpers/class-helper'
import { getFormErrorFieldsFromError } from '~/helpers/error-helper'
// errros
import AlertError from '~/components/alerts/AlertError'
// buttons
import LoadingButton from '~/components/buttons/LoadingButton'
// validations
import {
  hasErrorForField,
  showInputValidation,
} from '~/components/forms/validations/ValidationForm'
// apis
import { postLocalTransferMv } from '~/apis/filesystem-api'
// browsers
import RemoteFilesystemBrowser from '~/modules/filesystem/components/browsers/RemoteFilesystemBrowser'
// overlays
import BaseSlideOver from '~/components/overlays/BaseSliderOver'
// notices
import AlertInfo from '~/components/alerts/AlertInfo'

const MoveForm: React.FC<any> = ({ formData, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<any>(null)
  const [isOpenTargetBrowse, setIsOpenTargetBrowse] = useState(false)
  const sourcePath = `${formData.currentPath}/${formData.file.name}`
  const [formValues, setFormValues] = useState({
    targetPath: sourcePath,
  })
  const formErrorFields = getFormErrorFieldsFromError(localError)

  const handleOnSubmit = (event: any) => {
    event.preventDefault()
    setLoading(true)
    const fetchData = async () => {
      const response: GetTransferMvResponse = await postLocalTransferMv(
        formData.system,
        sourcePath,
        formValues.targetPath,
      )
      setLoading(false)
      onSuccess(response)
    }
    fetchData().catch((response) => {
      setLoading(false)
      setLocalError(response?.error)
    })
  }

  const handleOnTargetBrowse = () => {
    setIsOpenTargetBrowse(true)
  }

  const handleOnBrowseTargetSelection = (systemName: string, targetPath: string) => {
    setFormValues({ ...formValues, targetPath: targetPath })
    setIsOpenTargetBrowse(false)
  }

  return (
    <form className='relative' onSubmit={handleOnSubmit}>
      <BaseSlideOver
        isOpen={isOpenTargetBrowse}
        setIsOpen={setIsOpenTargetBrowse}
        title={'Browse remote filesystem'}
        subtitle={'Navigate the remote file system and select the file you want to run'}
      >
        <RemoteFilesystemBrowser
          initCurrentPath={formData.currentPath}
          initSystemName={formData.system}
          onBrowseSelection={handleOnBrowseTargetSelection}
          limitSameSystem={true}
        />
      </BaseSlideOver>
      <AlertInfo title='Asynchronous File Move' className='mb-4'>
        <p className='mb-2'>
          This operation will be performed asynchronously. Once the operation is complete, the
          changes will be visible in the file system.
        </p>
      </AlertInfo>
      <div>
        <AlertError error={localError} />
        <div className='grid grid-cols-6 gap-6'>
          <div className='col-span-6 sm:col-span-6'>
            <label htmlFor='sourcePath' className='block text-sm font-medium text-gray-700'>
              Source Path
            </label>
            <input
              type='text'
              name='sourcePath'
              value={sourcePath}
              className='mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none border-gray-300 focus:border-blue-300 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200'
              disabled
              readOnly
            />
          </div>
          <div className='col-span-6 sm:col-span-6'>
            <div>
              <label htmlFor='targetPath' className='block text-sm font-medium text-gray-700'>
                Target Paths <span className='italic text-red-400'>*</span>
              </label>
              <div className='flex mt-1 rounded-md shadow-sm'>
                <div className='relative flex flex-grow items-stretch focus-within:z-10'>
                  <input
                    type='text'
                    name='targetPath'
                    value={formValues.targetPath}
                    onChange={(e) => setFormValues({ ...formValues, targetPath: e.target.value })}
                    className={classNames(
                      hasErrorForField({
                        fieldName: 'targetPath',
                        formErrorFields: formErrorFields,
                      })
                        ? 'border-red-300 focus:border-red-300 focus:ring-red-300'
                        : 'border-gray-300 focus:border-blue-300 focus:ring-blue-300',
                      'block w-full rounded-l-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none',
                    )}
                    placeholder='here/your/target/path'
                  />
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
            {showInputValidation({
              fieldName: 'targetPath',
              formErrorFields: formErrorFields,
            })}
            <div className='flex mt-1'>
              <div className='flex-shrink-0'>
                <InformationCircleIcon className='text-blue-400 h-5 w-5' />
              </div>
              <div className='ml-1 text-xs text-blue-400'>Absolute path to destination</div>
            </div>
          </div>
        </div>
      </div>
      <div className='flex items-center justify-end mt-6 text-right'>
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
    </form>
  )
}

export default MoveForm
