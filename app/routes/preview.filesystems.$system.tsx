/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { json } from '@remix-run/node'
import { StatusCodes } from 'http-status-codes'
import type { LoaderFunctionArgs, LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// helpers
import { getMimeType } from '~/helpers/file-helper'

const ERROR_MESSAGES: Record<number, string> = {
  [StatusCodes.REQUEST_TOO_LONG]: 'The file exceeds the maximum size allowed for direct preview. Use the Download option instead.',
  [StatusCodes.FORBIDDEN]: 'You do not have permission to access this file.',
  [StatusCodes.NOT_FOUND]: 'The file could not be found.',
  [StatusCodes.UNAUTHORIZED]: 'You are not authorized to access this file.',
}

export const loader: LoaderFunction = async ({ params, request }: LoaderFunctionArgs) => {
  // Auth check only — the browser loads the binary content directly from the resource route
  const headers = new Headers()
  await getAuthAccessToken(request, headers)
  const url = new URL(request.url)
  const sourcePath = url.searchParams.get('sourcePath') || ''
  const account = url.searchParams.get('account') || ''
  const fileName = sourcePath.substring(sourcePath.lastIndexOf('/') + 1)
  const mimeType = getMimeType(fileName)
  const previewUrl = `/fs/filesystems/systems/${params.system}/accounts/${account}/ops/preview?sourcePath=${sourcePath}`
  return json({ fileName, sourcePath, mimeType, previewUrl })
}

export default function BinaryFileViewer() {
  const { fileName, sourcePath, mimeType, previewUrl } = useLoaderData<{
    fileName: string
    sourcePath: string
    mimeType: string
    previewUrl: string
  }>()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<number | null>(null)

  const handleError = async () => {
    try {
      const res = await fetch(previewUrl)
      const data = await res.json()
      const statusCode: number = data?.error?.statusCode ?? res.status
      setErrorCode(statusCode)
      setErrorMessage(
        ERROR_MESSAGES[statusCode] ?? `An unexpected error occurred (HTTP ${statusCode}).`,
      )
    } catch {
      setErrorMessage('An unexpected error occurred while loading the file.')
    }
  }

  const titleBar = (
    <div className='flex items-center gap-3 px-4 py-2 bg-[#252526] border-b border-[#3c3c3c] shrink-0'>
      <span className='text-[#cccccc] font-medium truncate' title={sourcePath}>
        {fileName}
      </span>
      <span className='text-[#858585] text-xs truncate hidden sm:block'>{sourcePath}</span>
    </div>
  )

  const errorPanel = (
    <div className='flex flex-1 items-center justify-center'>
      <div className='flex flex-col items-center gap-3 text-center max-w-md px-6'>
        <ExclamationTriangleIcon className='h-10 w-10 text-[#f48771]' />
        <p className='text-[#f48771] font-semibold text-base'>Unable to preview file</p>
        <p className='text-[#9d9d9d] text-sm'>{errorMessage}</p>
        {errorCode && <p className='text-[#555555] text-xs'>HTTP {errorCode}</p>}
      </div>
    </div>
  )

  const isImage = mimeType.startsWith('image/')
  const isPdf = mimeType === 'application/pdf'
  const isVideo = mimeType.startsWith('video/')
  const isAudio = mimeType.startsWith('audio/')

  const renderContent = () => {
    if (errorMessage) return errorPanel

    if (isImage) {
      return (
        <div className='flex flex-1 items-center justify-center overflow-auto p-4'>
          <img
            src={previewUrl}
            alt={fileName}
            className='max-w-full max-h-full object-contain'
            onError={handleError}
          />
        </div>
      )
    }

    if (isPdf) {
      return (
        <iframe
          src={previewUrl}
          title={fileName}
          className='flex-1 w-full border-0'
          onError={handleError}
        />
      )
    }

    if (isVideo) {
      return (
        <div className='flex flex-1 items-center justify-center overflow-auto p-4'>
          <video controls className='max-w-full max-h-full' onError={handleError}>
            <source src={previewUrl} type={mimeType} />
            <track kind='captions' />
          </video>
        </div>
      )
    }

    if (isAudio) {
      return (
        <div className='flex flex-1 items-center justify-center'>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls onError={handleError}>
            <source src={previewUrl} type={mimeType} />
          </audio>
        </div>
      )
    }

    return errorPanel
  }

  return (
    <div className='flex flex-col h-screen bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm'>
      {titleBar}
      {renderContent()}
    </div>
  )
}
