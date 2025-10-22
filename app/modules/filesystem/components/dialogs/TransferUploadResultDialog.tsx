/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/
import React, { useEffect, useMemo, useState } from 'react'
// dialogs
import CodeBlock from '~/components/codes/CodeBlock'
import TemplatedCodeBlock from '~/components/codes/TemplatedCodeBlock'
// types
import { GetTransferUploadResponse } from '~/types/api-filesystem'
// dialogs
import SimpleDialog, { SimpleDialogSize } from '~/components/dialogs/SimpleDialog'
import { formatArray } from '~/helpers/code-helper'
// types
import { LanguegeType } from '~/types/language'

interface TransferUploadResultDialogProps {
  targetPath: string
  transferResult: GetTransferUploadResponse | null
  open: boolean
  onClose: () => void
}

const DEFAULT_PATH = '/path/to/local/file'

const TransferUploadResultDialog: React.FC<TransferUploadResultDialogProps> = ({
  targetPath,
  transferResult,
  open,
  onClose,
}) => {
  // ---------------------------
  // 🧩 Hooks (must always run)
  // ---------------------------
  const [templateRaw, setTemplateRaw] = useState<string>('')
  const [scriptFilled, setScriptFilled] = useState<string>('')
  const [filePath, setFilePath] = useState<string>(DEFAULT_PATH)

  // ---------------------------
  // 📦 Helpers
  // ---------------------------
  const getTransferDirectives = () => {
    if (!transferResult) return null
    const { transferDirectives } = transferResult
    const { parts_upload_urls, complete_upload_url, max_part_size } = transferDirectives
    return {
      partsUploadUrls: parts_upload_urls,
      completeUploadUrl: complete_upload_url,
      maxPartSize: max_part_size,
      blocSize: '1048576', // 1MB
    }
  }

  // ---------------------------
  // 📄 Load the script template once per transfer result
  // ---------------------------
  useEffect(() => {
    const loadTemplate = async () => {
      if (!transferResult) return
      try {
        const res = await fetch('/file_upload_script_template.txt')
        const txt = await res.text()
        setTemplateRaw(txt)
      } catch (err) {
        console.error('Failed to load template:', err)
      }
    }
    loadTemplate()
  }, [transferResult])

  // ---------------------------
  // 🧠 Compute bash data for replacement
  // ---------------------------
  const bashData = useMemo(() => {
    if (!transferResult) return null
    const data = getTransferDirectives()
    if (!data) return null
    const { partsUploadUrls, completeUploadUrl, maxPartSize, blocSize } = data
    return {
      partsUploadUrls: formatArray(partsUploadUrls, LanguegeType.bash),
      completeUploadUrl: JSON.stringify(completeUploadUrl, null, 2),
      maxPartSize: String(maxPartSize),
      blocSize: String(blocSize),
      outputFilePath: filePath,
    }
  }, [transferResult, filePath])

  // ---------------------------
  // 🧩 Fill template when data changes
  // ---------------------------
  useEffect(() => {
    if (!templateRaw || !bashData) return
    const filled = templateRaw.replace(/{{(.*?)}}/g, (_, key) => {
      const k = String(key).trim()
      return (bashData as any)[k] ?? ''
    })
    setScriptFilled(filled)
  }, [templateRaw, bashData])

  // ---------------------------
  // 📥 Download & Copy actions
  // ---------------------------
  const downloadFileName = useMemo(() => {
    const base = filePath.trim().split('/').filter(Boolean).pop()
    return base || 'firecrest-upload.sh'
  }, [filePath])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(scriptFilled)
      alert('✅ Script copied to clipboard.')
    } catch {
      alert('Could not copy. Please select and copy manually.')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([scriptFilled], { type: 'text/x-sh' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadFileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const usageCommands = useMemo(() => {
    const p = filePath || DEFAULT_PATH
    return [
      '# Make it executable',
      `chmod +x /path/to/your/script_file`,
      '# 3) Run it',
      '/path/to/your/script_file',
    ].join('\n')
  }, [filePath])

  const handleCopyUsage = async () => {
    try {
      await navigator.clipboard.writeText(usageCommands)
      alert('✅ Usage commands copied.')
    } catch {
      alert('Could not copy usage commands.')
    }
  }

  // ---------------------------
  // 🖼️ Render
  // ---------------------------
  // (all hooks have run above — safe to early-return now)
  if (!transferResult) return null

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
        {/* ✅ Success message */}
        <div className='rounded-md bg-green-50 border border-green-200 p-4'>
          <p>
            ✅ The upload operation to the destination path{' '}
            <span className='font-medium text-green-800 break-all'>&quot;{targetPath}&quot;</span>{' '}
            has been successfully submitted.
          </p>
        </div>

        {/* 📖 Multipart upload info */}
        <section>
          <h3 className='text-base font-semibold text-gray-900 mb-3'>
            Uploading large files using S3 multipart protocol
          </h3>
          <div className='space-y-3 leading-relaxed'>
            <p>
              For large file uploads, FirecREST provides upload URLs based on the S3 multipart
              protocol. The number of URLs depends on the file size and FirecREST settings.
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
            <p>
              We provide below a bash script template that you can use to upload your file in parts.
            </p>
          </div>
        </section>

        {/* 📝 File path field */}
        <section>
          <h3 className='text-base font-semibold text-gray-900 mb-2'>1. Complete the script</h3>
          <p className='text-gray-600 py-2'>
            Complete the script by specifying the path to your local file below.
          </p>
          <div className='flex flex-col gap-2'>
            <input
              type='text'
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs text-gray-900'
              placeholder={DEFAULT_PATH}
            />
            <p className='text-gray-600'>
              This path will appear in the commands below and (if supported) inside the script
              template.
            </p>
          </div>
        </section>

        {/* 🧰 Script example + actions */}
        <section>
          <h3 className='text-base font-semibold text-gray-900 mb-3'>
            2. Copy or download the upload script
          </h3>
          <p className='leading-relaxed mb-4'>
            The script below uses <code>dd</code> and defines part upload URLs and completion URL in
            the header.
          </p>

          <div className='flex flex-wrap items-center gap-2 mb-3'>
            <button
              onClick={handleDownload}
              className='rounded-md bg-white text-gray-800 px-3 py-1.5 text-xs border border-gray-300 hover:bg-gray-50'
              title={`Download as ${downloadFileName}`}
            >
              Download script
            </button>
          </div>

          <TemplatedCodeBlock code={scriptFilled} />
        </section>

        {/* 💡 How to use */}
        <section>
          <h3 className='text-base font-semibold text-gray-900 mb-2 py-3'>3. Run the script</h3>

          <TemplatedCodeBlock code={usageCommands} />
        </section>
      </div>
    </SimpleDialog>
  )
}

export default TransferUploadResultDialog
