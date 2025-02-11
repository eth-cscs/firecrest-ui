/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// dialogs
import SimpleDialog from '~/components/dialogs/SimpleDialog'

const UploadDialog: React.FC<any> = ({ open, onClose }: any) => {
  return (
    <SimpleDialog
      title='Upload file'
      subtitle='Upload a file in the current path'
      open={open}
      onClose={onClose}
    >
      UploadFileDialog
    </SimpleDialog>
  )
}

export default UploadDialog
