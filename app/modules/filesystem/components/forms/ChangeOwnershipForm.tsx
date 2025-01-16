import React, { useState } from 'react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
// types
import { GetOpsChownResponse } from '~/types/api-filesystem'
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
import { putLocalOpsChown } from '~/apis/filesystem-api'

const ChangeOwnershipForm: React.FC<any> = ({ formData, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<any>(null)
  const [formValues, setFormValues] = useState({
    owner: '',
    group: '',
  })
  const targetPath = `${formData.currentPath}/${formData.file.name}`
  const formErrorFields = getFormErrorFieldsFromError(localError)
  const handleOnSubmit = (event: any) => {
    event.preventDefault()
    setLoading(true)
    const fetchData = async () => {
      const response: GetOpsChownResponse = await putLocalOpsChown(
        formData.system,
        targetPath,
        formValues.owner,
        formValues.group,
      )
      setLoading(false)
      onSuccess(response)
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
          </div>
          <div className='col-span-6 sm:col-span-6'>
            <label htmlFor='owner' className='block text-sm font-medium text-gray-700'>
              Owner
            </label>
            <input
              type='text'
              name='owner'
              value={formValues.owner}
              onChange={(e) => setFormValues({ ...formValues, owner: e.target.value })}
              className={classNames(
                hasErrorForField({
                  fieldName: 'owner',
                  formErrorFields: formErrorFields,
                })
                  ? 'border-red-300 focus:border-red-300 focus:ring-red-300'
                  : 'border-gray-300 focus:border-blue-300 focus:ring-blue-300',
                'mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none ',
              )}
              placeholder=''
            />
            {showInputValidation({
              fieldName: 'owner',
              formErrorFields: formErrorFields,
            })}
            <div className='flex mt-1'>
              <div className='flex-shrink-0'>
                <InformationCircleIcon className='text-blue-400 h-5 w-5' />
              </div>
              <div className='ml-1 text-xs text-blue-400'>Owner username for target</div>
            </div>
          </div>
          <div className='col-span-6 sm:col-span-6'>
            <label htmlFor='group' className='block text-sm font-medium text-gray-700'>
              group
            </label>
            <input
              type='text'
              name='group'
              value={formValues.group}
              onChange={(e) => setFormValues({ ...formValues, group: e.target.value })}
              className={classNames(
                hasErrorForField({
                  fieldName: 'group',
                  formErrorFields: formErrorFields,
                })
                  ? 'border-red-300 focus:border-red-300 focus:ring-red-300'
                  : 'border-gray-300 focus:border-blue-300 focus:ring-blue-300',
                'mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none ',
              )}
              placeholder=''
            />
            {showInputValidation({
              fieldName: 'group',
              formErrorFields: formErrorFields,
            })}
            <div className='flex mt-1'>
              <div className='flex-shrink-0'>
                <InformationCircleIcon className='text-blue-400 h-5 w-5' />
              </div>
              <div className='ml-1 text-xs text-blue-400'>Group username for target</div>
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

export default ChangeOwnershipForm
