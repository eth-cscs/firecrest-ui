/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
// dialogs
import SimpleDialog from '~/components/dialogs/SimpleDialog'
// forms
import CreateDirectoryForm from '~/modules/filesystem/components/forms/CreateDirectoryForm'

interface CreateDirectoryDialogProps {
  system: string
  currentPath: string
  open: boolean
  onClose: () => void
}

const CreateDirectoryDialog: React.FC<CreateDirectoryDialogProps> = ({
  system,
  currentPath,
  open,
  onClose,
}: CreateDirectoryDialogProps) => {
  const formData = {
    system: system,
    currentPath: currentPath,
  }

  const handleOnSuccess = (data: any) => {
    onClose()
    window.location.reload()
  }

  const handleOnError = (error: any) => {}

  return (
    <SimpleDialog
      title='Create directory'
      subtitle={`Create a new directory in the current path "${currentPath}"`}
      open={open}
      onClose={onClose}
    >
      <CreateDirectoryForm
        formData={formData}
        onSuccess={handleOnSuccess}
        onError={handleOnError}
      />
    </SimpleDialog>
  )
}

export default CreateDirectoryDialog
