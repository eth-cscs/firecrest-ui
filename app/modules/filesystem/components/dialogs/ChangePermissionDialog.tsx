import React from 'react'
// types
import { File } from '~/types/api-filesystem'
// dialogs
import SimpleDialog, { SimpleDialogSize } from '~/components/dialogs/SimpleDialog'
// forms
import ChangePermissionForm from '~/modules/filesystem/components/forms/ChangePermissionForm'

interface ChangePermissionDialogProps {
  system: string
  file: File
  currentPath: string
  open: boolean
  onClose: () => void
}

const ChangePermissionDialog: React.FC<ChangePermissionDialogProps> = ({
  system,
  file,
  currentPath,
  open,
  onClose,
}: ChangePermissionDialogProps) => {
  const formData = {
    system: system,
    file: file,
    currentPath: currentPath,
  }

  const handleOnSuccess = (data: any) => {
    onClose()
    window.location.reload()
  }

  const handleOnError = (error: any) => {}
  return (
    <SimpleDialog
      title='Change permission (mode bits)'
      subtitle='Change the file permission of the selected file according to the specified mode'
      size={SimpleDialogSize.MEDIUM}
      open={open}
      onClose={onClose}
    >
      <ChangePermissionForm
        formData={formData}
        onSuccess={handleOnSuccess}
        onError={handleOnError}
      />
    </SimpleDialog>
  )
}

export default ChangePermissionDialog
