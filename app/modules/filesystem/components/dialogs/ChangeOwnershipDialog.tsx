/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
// types
import { File } from '~/types/api-filesystem'
// dialogs
import SimpleDialog, { SimpleDialogSize } from '~/components/dialogs/SimpleDialog'
// forms
import ChangeOwnershipForm from '~/modules/filesystem/components/forms/ChangeOwnershipForm'

interface ChangeOwnershipDialogProps {
  system: string
  file: File
  currentPath: string
  open: boolean
  onClose: () => void
}

const ChangeOwnershipDialog: React.FC<ChangeOwnershipDialogProps> = ({
  system,
  file,
  currentPath,
  open,
  onClose,
}: ChangeOwnershipDialogProps) => {
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
      title='Change ownership (owner and group)'
      subtitle='Changes the user and/or group ownership of the selected file, if only owner or group information is passed, only that information will be updated'
      size={SimpleDialogSize.MEDIUM}
      open={open}
      onClose={onClose}
    >
      <ChangeOwnershipForm
        formData={formData}
        onSuccess={handleOnSuccess}
        onError={handleOnError}
      />
    </SimpleDialog>
  )
}

export default ChangeOwnershipDialog
