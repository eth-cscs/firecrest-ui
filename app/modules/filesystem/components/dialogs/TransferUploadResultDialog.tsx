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
import { formatArray } from '~/helpers/code-helper'

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

  const getTransferDirectives = () => {
    const { transferDirectives } = transferResult
    // const { partsUploadUrls, completeUploadUrl, maxPartSize } = transferDirectives
    const { parts_upload_urls, complete_upload_url, max_part_size } = transferDirectives

    const data = {
      partsUploadUrls: formatArray(parts_upload_urls),
      completeUploadUrl: JSON.stringify(complete_upload_url, null, 2),
      maxPartSize: String(max_part_size),
      bloc_size: '1048576', // 1MB
    }
    return data
  }

  useEffect(() => {
    const loadScriptTemplate = async () => {
      try {
        // Load the file from the public folder
        const templateScriptResponse = await fetch('/public/file_upload_script_template.txt')
        const templateScriptText = await templateScriptResponse.text()

        const data = getTransferDirectives()

        const filled = templateScriptText.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] ?? '')
        setScriptTemplate(filled)
      } catch (error) {
        console.error('Failed to load template:', error)
      }
    }

    loadScriptTemplate()
  }, [transferResult])

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
      closeButtonName='Close'
    >
      <div className='space-y-8 text-sm text-gray-700'>
        {/* Success message */}
        <div className='rounded-md bg-green-50 border border-green-200 p-4'>
          <p>
            ✅ The upload operation to the destination path{' '}
            <span className='font-medium text-green-800 break-all'>&quot;{targetPath}&quot;</span>{' '}
            has been successfully submitted.
          </p>
        </div>

        {/* Section: Multipart upload info */}
        <section>
          <h3 className='text-base font-semibold text-gray-900 mb-3'>
            Uploading large files using S3 multipart protocol
          </h3>
          <div className='space-y-3 leading-relaxed'>
            <p>
              For large file uploads, FirecREST provides upload URLs based on the S3 multipart
              protocol. The number of URLs depends on the file size and the FirecREST settings.
            </p>
            <p>
              You must split the file accordingly and upload each part to its assigned URL. Once all
              parts have been uploaded, call the provided
              <span className='font-medium'> complete upload URL</span> to finalize the transfer.
              After completion, a remote job moves the file from the staging storage to its final
              destination.
            </p>
            <p>
              📘 Learn more in the{' '}
              <a
                href='https://eth-cscs.github.io/firecrest-v2/user_guide/file_transfer_bash/'
                target='_blank'
                rel='noreferrer'
                className='text-blue-600 hover:underline font-medium'
              >
                FirecREST User Guide
              </a>
              .
            </p>
          </div>
        </section>

        <section>
          <h3 className='text-base font-semibold text-gray-900 mb-3'>File upload result</h3>
          <p className='leading-relaxed mb-4'>
            The following snippet is the result of the upload request, containing the transfer
            directives with the upload URLs and other relevant information.
          </p>
          <TemplatedCodeBlock code={JSON.stringify(getTransferDirectives(), null, 2)} />
        </section>

        <section>
          <h3 className='text-base font-semibold text-gray-900 mb-3'>
            Usage example (using <code>dd</code>)
          </h3>
          <p className='leading-relaxed mb-4'>
            The script example below uses <code>dd</code> and has the part upload URLs and the
            complete URL defined in the header.
          </p>
          <TemplatedCodeBlock code={scriptTemplate} />
        </section>
      </div>
    </SimpleDialog>
  )
}

export default TransferUploadResultDialog
