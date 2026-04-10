/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { json } from '@remix-run/node'
import { StatusCodes } from 'http-status-codes'
import type { LoaderFunctionArgs, LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
// utils
import { getAuthAccessToken } from '~/utils/auth.server'
// apis
import { getOpsDownload } from '~/apis/filesystem-api'

const ERROR_MESSAGES: Record<number, string> = {
  [StatusCodes.REQUEST_TOO_LONG]: 'The file exceeds the maximum size allowed for direct preview. Use the Download option instead.',
  [StatusCodes.FORBIDDEN]: 'You do not have permission to access this file.',
  [StatusCodes.NOT_FOUND]: 'The file could not be found.',
  [StatusCodes.UNAUTHORIZED]: 'You are not authorized to access this file.',
}

type LoaderData =
  | { ok: true; content: string; fileName: string; sourcePath: string }
  | { ok: false; statusCode: number; message: string; fileName: string; sourcePath: string }

export const loader: LoaderFunction = async ({ params, request }: LoaderFunctionArgs) => {
  const headers = new Headers()
  const accessToken = await getAuthAccessToken(request, headers)
  const system: string = params.systemName || ''
  const url = new URL(request.url)
  const sourcePath = url.searchParams.get('sourcePath') || ''
  const fileName = sourcePath.substring(sourcePath.lastIndexOf('/') + 1)
  try {
    const blob: Blob = await getOpsDownload(accessToken, system, sourcePath)
    const content = await blob.text()
    return json<LoaderData>({ ok: true, content, fileName, sourcePath })
  } catch (error) {
    if (error instanceof Response) {
      const statusCode = error.status
      const message =
        ERROR_MESSAGES[statusCode] ?? `An unexpected error occurred (HTTP ${statusCode}).`
      return json<LoaderData>({ ok: false, statusCode, message, fileName, sourcePath })
    }
    throw error
  }
}

export default function FileTextViewer() {
  const data = useLoaderData<LoaderData>()

  const titleBar = (
    <div className='flex items-center gap-3 px-4 py-2 bg-gray-100 border-b border-gray-200 shrink-0'>
      <span className='text-gray-800 font-medium truncate' title={data.sourcePath}>
        {data.fileName}
      </span>
      <span className='text-gray-400 text-xs truncate hidden sm:block'>{data.sourcePath}</span>
    </div>
  )

  if (!data.ok) {
    return (
      <div className='flex flex-col h-screen bg-white text-gray-800 font-mono text-sm'>
        {titleBar}
        <div className='flex flex-1 items-center justify-center'>
          <div className='flex flex-col items-center gap-3 text-center max-w-md px-6'>
            <ExclamationTriangleIcon className='h-10 w-10 text-red-500' />
            <p className='text-red-600 font-semibold text-base'>
              Unable to preview file
            </p>
            <p className='text-gray-500 text-sm'>{data.message}</p>
            <p className='text-gray-400 text-xs'>HTTP {data.statusCode}</p>
          </div>
        </div>
      </div>
    )
  }

  const lines = data.content === '' ? [] : data.content.split('\n')
  const lineNumberWidth = String(lines.length || 1).length

  return (
    <div className='flex flex-col h-screen bg-white text-gray-800 font-mono text-sm'>
      {titleBar}

      {/* Code area */}
      <div className='flex-1 overflow-auto'>
        {lines.length === 0 ? (
          <div className='flex items-start px-4 pt-3'>
            <span className='text-gray-400 text-sm italic'>Empty file</span>
          </div>
        ) : (
          <table className='w-full border-collapse'>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className='hover:bg-gray-50'>
                  <td
                    className='select-none text-right text-gray-400 pr-4 pl-4 py-0 leading-6 align-top border-r border-gray-200'
                    style={{ minWidth: `${lineNumberWidth + 2}ch` }}
                  >
                    {i + 1}
                  </td>
                  <td className='pl-4 pr-8 py-0 leading-6 align-top whitespace-pre'>
                    {line || '\u00a0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status bar */}
      <div className='flex items-center gap-4 px-4 py-1 bg-gray-100 border-t border-gray-200 text-gray-500 text-xs shrink-0'>
        <span>{lines.length} lines</span>
        <span>{data.content.length} chars</span>
      </div>
    </div>
  )
}
