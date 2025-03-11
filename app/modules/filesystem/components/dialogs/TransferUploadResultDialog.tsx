/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// dialogs
import CodeBlock from '~/components/codes/CodeBlock'
// types
import { GetTransferUploadResponse } from '~/types/api-filesystem'
// dialogs
import SimpleDialog, { SimpleDialogSize } from '~/components/dialogs/SimpleDialog'

interface TransferUploadResultDialogProps {
  targetPath: string
  transferResult: GetTransferUploadResponse
  open: boolean
  onClose: () => void
}

const TransferUploadResultDialog: React.FC<TransferUploadResultDialogProps> = ({
  targetPath,
  transferResult,
  open,
  onClose,
}: TransferUploadResultDialogProps) => {
  if (!transferResult || transferResult === null) {
    return null
  }

  return (
    <SimpleDialog
      title='Transfer Upload Operation'
      subtitle='The upload operation has been successfully submitted'
      open={open}
      onClose={onClose}
      size={SimpleDialogSize.LARGE}
      closeButtonName='close'
    >
      <div className='mb-5'>
        <p className='text-sm mb-4'>
          The upload operation to the destination path &quot;{targetPath}&quot; has been
          successfully submitted.
        </p>
        <h4 className='text-me mb-2 mt-8 font-medium'>Upload instructions</h4>
        <h5 className='text-sm mb-2 mt-8 font-medium'>
          1. Upload the single file chunks (number of chunks depends on the file size)
        </h5>
        {transferResult.partsUploadUrls.map(
          (partUpload: any, idx: React.Key | null | undefined) => (
            <>
              <p className='text-sm mb-2'>Part {(idx as number) + 1}:</p>
              <CodeBlock
                key={idx}
                code={`curl '${partUpload}' --upload-file [path to local file]`}
              />
              <div className='mt-5 pb-2' />
            </>
          ),
        )}
        <h5 className='text-sm mb-2 mt-8 font-medium'>2. Complete the upload</h5>
        <CodeBlock
          code={`curl '${transferResult.completeUploadUrl}' --upload-file [path to local file]`}
        />
      </div>
    </SimpleDialog>
  )
}

export default TransferUploadResultDialog
