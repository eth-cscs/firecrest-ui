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
        <h5 className='text-sm mb-2 font-medium'>Complete signed Upload URL:</h5>
        <p className='text-sm mb-2'>
          Use the following signed URL to upload your local file to the S3 storage.
        </p>
        <CodeBlock code={transferResult.completeUploadUrl} />
        <h5 className='text-sm mb-2 mt-8 font-medium'>Usage Example:</h5>
        <p className='text-sm mb-2'>
          The following is a command line example to upload your large file using the curl command.
        </p>
        <CodeBlock
          code={`curl '${transferResult.completeUploadUrl}' --upload-file [path to local file]`}
        />
        <h5 className='text-sm mb-2 mt-8 font-medium'>Multiparts upload:</h5>
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
      </div>
    </SimpleDialog>
  )
}

export default TransferUploadResultDialog
