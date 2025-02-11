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
import SymlinkForm from '~/modules/filesystem/components/forms/SymlinkForm'

interface SymLinkDialogProps {
  system: string
  file: File
  currentPath: string
  open: boolean
  onClose: () => void
}

const SymLinkDialog: React.FC<SymLinkDialogProps> = ({
  system,
  file,
  currentPath,
  open,
  onClose,
}: SymLinkDialogProps) => {
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
      title='Create symlink'
      subtitle='Create a symlink for the selected file to a target path'
      size={SimpleDialogSize.MEDIUM}
      open={open}
      onClose={onClose}
    >
      <SymlinkForm formData={formData} onSuccess={handleOnSuccess} onError={handleOnError} />
    </SimpleDialog>
  )
}

export default SymLinkDialog
