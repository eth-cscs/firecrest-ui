/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
// dialogs
import SimpleDialog, { SimpleDialogSize } from '~/components/dialogs/SimpleDialog'
// forms
import RenameForm from '~/modules/filesystem/components/forms/RenameForm'

const RenameDialog: React.FC<any> = ({ fileSystemObject, fileSystemInfo, open, onClose }: any) => {
  const formData = {
    fileSystemObject: fileSystemObject,
    fileSystemInfo: fileSystemInfo,
  }

  const handleOnSuccess = (data: any) => {
    onClose()
    window.location.reload()
  }

  const handleOnError = (error: any) => {}

  return (
    <SimpleDialog
      title='Rename/move a file, directory, or symlink'
      subtitle='Rename/move the selected file, directory, or symlink to the targetPath'
      size={SimpleDialogSize.MEDIUM}
      open={open}
      onClose={onClose}
    >
      <RenameForm formData={formData} onSuccess={handleOnSuccess} onError={handleOnError} />
    </SimpleDialog>
  )
}

export default RenameDialog
