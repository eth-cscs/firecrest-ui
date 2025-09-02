/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useEffect, useState } from 'react'
import { ArrowDownIcon } from '@heroicons/react/24/outline'
// types
import { File, GetTransferDownloadResponse } from '~/types/api-filesystem'
// spinners
import LoadingSpinner from '~/components/spinners/LoadingSpinner'
// dialogs
import SimpleDialog from '~/components/dialogs/SimpleDialog'
import CodeBlock from '~/components/codes/CodeBlock'
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
// config
import uiConfig from '~/configs/ui.config'
import { postLocalTransferDownload } from '~/apis/filesystem-api'

interface DownloadDialogProps {
  system: string
  file: File
  currentPath: string
  open: boolean
  onClose: () => void
}

const DownloadDialog: React.FC<DownloadDialogProps> = ({
  system,
  file,
  currentPath,
  open,
  onClose,
}: DownloadDialogProps) => {
  const filePath = `${currentPath}/${file.name}`
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadJob, setDownloadJob] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (open) {
      setDownloadUrl(null)
      setDownloadJob(null)
      setLoading(false)
    }
  }, [open])

  const postFileTransferDownload = async (system: string, filePath: string) => {
    setLoading(true)
    const response: GetTransferDownloadResponse = await postLocalTransferDownload(system, filePath)
    setDownloadUrl(response.downloadUrl)
    setDownloadJob(response.transferJob.jobId)
    setLoading(false)
  }

  const doDownloadFile = () => {
    if (file.size <= uiConfig.fileDownloadLimit) {
      const downloadEndpoint = `/fs/filesystems/${system}/ops/download?sourcePath=${filePath}`
      onClose()
      window.location.href = downloadEndpoint
    } else {
      postFileTransferDownload(system, filePath).catch((response) => {
        console.log(response)
      })
    }
  }

  const subTitle = `Donwload the file "${filePath}"`
  return (
    <SimpleDialog title='Download file' subtitle={subTitle} open={open} onClose={onClose}>
      {loading && <LoadingSpinner title='Preparing download...' className='py-10' />}
      {!loading && (
        <>
          {!downloadUrl && (
            <div className='flex justify-center'>
              <button
                type='button'
                className='inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                onClick={doDownloadFile}
              >
                <ArrowDownIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />
                Download file
              </button>
            </div>
          )}
          {downloadUrl && (
            <>
              <div className='text-sm font-medium text-gray-900 pb-2'>
                Please wait till job <LabelBadge color={LabelColor.BLUE}>{downloadJob}</LabelBadge>{' '}
                completes and used the link below to download the file.
              </div>
              <CodeBlock code={downloadUrl} />
            </>
          )}
        </>
      )}
    </SimpleDialog>
  )
}

export default DownloadDialog
