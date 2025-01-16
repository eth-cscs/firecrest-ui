import React, { useState } from 'react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
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
import { postLocalOpsSymlink } from '~/apis/filesystem-api'

const SymlinkForm: React.FC<any> = ({ formData, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<any>(null)
  const [formValues, setFormValues] = useState({
    linkPath: '',
  })
  const targetPath = `${formData.currentPath}/${formData.file.name}`
  const formErrorFields = getFormErrorFieldsFromError(localError)

  const handleOnSubmit = (event: any) => {
    event.preventDefault()
    setLoading(true)
    const fetchData = async () => {
      await postLocalOpsSymlink(formData.system, targetPath, formValues.linkPath)
      setLoading(false)
      onSuccess()
    }
    fetchData().catch((response) => {
      setLoading(false)
      setLocalError(response?.error)
    })
  }

  return (
    <form className='relative' onSubmit={handleOnSubmit}>
      <div>
        <AlertError error={localError} />
        <div className='grid grid-cols-6 gap-6'>
          <div className='col-span-6 sm:col-span-6'>
            <label htmlFor='targetPath' className='block text-sm font-medium text-gray-700'>
              Target Path
            </label>
            <input
              type='text'
              name='targetPath'
              value={targetPath}
              className='mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none border-gray-300 focus:border-blue-300 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200'
              disabled
              readOnly
            />
            <div className='flex mt-1'>
              <div className='flex-shrink-0'>
                <InformationCircleIcon className='text-blue-400 h-5 w-5' />
              </div>
              <div className='ml-1 text-xs text-blue-400'>
                Absolute filesystem path to target that the symlink will point to
              </div>
            </div>
          </div>
          <div className='col-span-6 sm:col-span-6'>
            <label htmlFor='linkPath' className='block text-sm font-medium text-gray-700'>
              Link Path <span className='italic text-red-400'>*</span>
            </label>
            <input
              type='text'
              name='linkPath'
              value={formValues.linkPath}
              onChange={(e) => setFormValues({ ...formValues, linkPath: e.target.value })}
              className={classNames(
                hasErrorForField({
                  fieldName: 'linkPath',
                  formErrorFields: formErrorFields,
                })
                  ? 'border-red-300 focus:border-red-300 focus:ring-red-300'
                  : 'border-gray-300 focus:border-blue-300 focus:ring-blue-300',
                'mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none ',
              )}
              placeholder='here/your/link/path'
            />
            {showInputValidation({
              fieldName: 'linkPath',
              formErrorFields: formErrorFields,
            })}
            <div className='flex mt-1'>
              <div className='flex-shrink-0'>
                <InformationCircleIcon className='text-blue-400 h-5 w-5' />
              </div>
              <div className='ml-1 text-xs text-blue-400'>Absolute path to the new symlink</div>
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

export default SymlinkForm
