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
import CopyForm from '~/modules/filesystem/components/forms/CopyForm'

interface CopyDialogProps {
  system: string
  file: File
  currentPath: string
  open: boolean
  onClose: () => void
}

const CopyDialog: React.FC<any> = ({
  system,
  file,
  currentPath,
  open,
  onClose,
}: CopyDialogProps) => {
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
      title='Copy file'
      subtitle='Copy the selected file to a tareget path'
      size={SimpleDialogSize.MEDIUM}
      open={open}
      onClose={onClose}
    >
      <CopyForm formData={formData} onSuccess={handleOnSuccess} onError={handleOnError} />
    </SimpleDialog>
  )
}

export default CopyDialog
