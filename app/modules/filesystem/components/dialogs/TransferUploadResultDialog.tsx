/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/
import React, { useEffect, useState } from 'react'
// dialogs
import CodeBlock from '~/components/codes/CodeBlock'
import TemplatedCodeBlock from '~/components/codes/TemplatedCodeBlock'
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
  const [scriptTemplate, setScriptTemplate] = useState<string>('')
  const [envTemplate, setEnvTemplate] = useState<string>('')

  useEffect(() => {
    const loadScriptTemplate = async () => {
      try {
        // Load the file from the public folder
        const templateScriptResponse = await fetch('/public/file_upload_script_template.txt')
        const templateScriptText = await templateScriptResponse.text()

        const { partsUploadUrls, completeUploadUrl, maxPartSize } = transferResult

        const data = {
          partsUploadUrls: JSON.stringify(partsUploadUrls, null, 2),
          completeUploadUrl: JSON.stringify(completeUploadUrl),
          maxPartSize: String(maxPartSize),
        }
        const filled = templateScriptText.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] ?? '')
        setScriptTemplate(filled)
      } catch (error) {
        console.error('Failed to load template:', error)
      }
    }

    loadScriptTemplate()
  }, [transferResult])

  useEffect(() => {
    const loadEnvTemplate = async () => {
      try {
        const templateEvnResponse = await fetch('/public/file_upload_env_template.txt')
        const templateEnvText = await templateEvnResponse.text()
        setEnvTemplate(templateEnvText)
      } catch (error) {
        console.error('Failed to load template:', error)
      }
    }

    loadEnvTemplate()
  }, [transferResult])

  if (!transferResult || transferResult === null) {
    return null
  }

  console.log(transferResult)

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
        <h4 className='text-me mb-2 mt-8 font-medium'>
          Uploading large files using S3 multipart protocol
        </h4>
        <h5 className='text-sm mb-2 mt-8 font-medium'>
          Uploading large files using S3 multipart protocol<br></br>
          For large file uploads, FirecREST provides upload URLs based on the S3 multipart protocol,
          the number of URLs depends on the file size and on the FirecREST settings.
          <br></br>The user must split the file accordingly and upload each part to the assigned
          URL. Once all parts have been uploaded, the user must call the provided complete upload
          URL to finalize the transfer. After completion, a remote job moves the file from the
          staging storage to its final destination.<br></br>
          Please find more information in the user guide{' '}
          <a href='https://eth-cscs.github.io/firecrest-v2/user_guide/file_transfer_bash/'>here</a>.
        </h5>
        <h4 className='text-me mb-2 mt-8 font-medium'>Script example (Using dd)</h4>
        <h5 className='text-sm mb-2 mt-8 font-medium'>
          To run the example you need first to set up the environment file using the provided
          env-template file. Set the field in the template as described int the user guide to match
          your deployment and save the template as a new file.
        </h5>
        <TemplatedCodeBlock code={envTemplate} />
        <h4 className='text-sm mb-2 mt-8 font-medium'>
          To run the example you need first to set up the environment file using the provided
          env-template file. Set the field in the template as described int the user guide to match
          your deployment and save the template as a new file.
        </h4>
        <TemplatedCodeBlock code={scriptTemplate} />
      </div>
    </SimpleDialog>
  )
}

export default TransferUploadResultDialog
