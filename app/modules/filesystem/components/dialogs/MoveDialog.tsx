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
import MoveForm from '~/modules/filesystem/components/forms/MoveForm'

interface MoveDialogProps {
  system: string
  file: File
  currentPath: string
  open: boolean
  onClose: () => void
}

const MoveDialog: React.FC<any> = ({
  system,
  file,
  currentPath,
  open,
  onClose,
}: MoveDialogProps) => {
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
      title='Move file'
      subtitle='Move the selected file to a tareget path'
      size={SimpleDialogSize.MEDIUM}
      open={open}
      onClose={onClose}
    >
      <MoveForm formData={formData} onSuccess={handleOnSuccess} onError={handleOnError} />
    </SimpleDialog>
  )
}

export default MoveDialog
