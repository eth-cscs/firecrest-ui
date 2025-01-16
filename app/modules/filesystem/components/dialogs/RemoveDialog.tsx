import React, { useState, useRef } from 'react'
import { useSubmit } from '@remix-run/react'
// types
import { File } from '~/types/api-filesystem'
// buttons
import LoadingButton from '~/components/buttons/LoadingButton'
// dialogs
import SimpleDialog from '~/components/dialogs/SimpleDialog'
// errros
import AlertError from '~/components/alerts/AlertError'
// helpers
import { classNames } from '~/helpers/class-helper'
// apis
import { deleteLocalRm } from '~/apis/filesystem-api'

interface RemoveDialogProps {
  system: string
  file: File
  currentPath: string
  open: boolean
  onClose: () => void
}

const RemoveDialog: React.FC<RemoveDialogProps> = ({
  system,
  file,
  currentPath,
  open,
  onClose,
}: RemoveDialogProps) => {
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<any>(null)
  const targetPath = `${currentPath}/${file.name}`

  const handleOnSubmit = (event: any) => {
    event.preventDefault()
    setLoading(true)
    const fetchData = async () => {
      await deleteLocalRm(system, targetPath)
      setLoading(false)
      window.location.reload()
      onClose()
    }
    fetchData().catch((response) => {
      setLoading(false)
      setLocalError(response?.error)
    })
  }

  const actionButtons = (
    <form method='post' onSubmit={handleOnSubmit}>
      <LoadingButton isLoading={loading} className='sm:w-auto sm:text-sm'>
        <button
          name='intent'
          value='delete'
          type='submit'
          className={classNames(
            !loading ? '' : 'opacity-50 cursor-not-allowed',
            'inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto',
          )}
          disabled={loading}
        >
          Delete file
        </button>
      </LoadingButton>
    </form>
  )

  return (
    <SimpleDialog
      title='Delete file'
      subtitle='Delete the selected file'
      open={open}
      onClose={onClose}
      actionButtons={actionButtons}
    >
      <AlertError error={localError} />
      <p className='text-sm text-gray-500'>
        Do you want to delete the selected file to the specified path{' '}
        <b>&quot;{targetPath}&quot;</b>?
      </p>
    </SimpleDialog>
  )
}

export default RemoveDialog
