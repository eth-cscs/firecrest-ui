/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { Fragment, useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import LoadingSpinner from '~/components/spinners/LoadingSpinner'

interface FilePreviewPanelProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  previewUrl: string
  fileName: string
}

const FilePreviewPanel: React.FC<FilePreviewPanelProps> = ({
  isOpen,
  setIsOpen,
  previewUrl,
  fileName,
}) => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
  }, [previewUrl])

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-10' onClose={setIsOpen}>
        <div className='fixed inset-0 overflow-hidden'>
          <div className='absolute inset-0 overflow-hidden'>
            {/* Full-screen on mobile, half-screen on sm+ */}
            <div className='pointer-events-none fixed inset-y-0 right-0 flex w-full sm:w-1/2'>
              <Transition.Child
                as={Fragment}
                enter='transform transition ease-in-out duration-500 sm:duration-700'
                enterFrom='translate-x-full'
                enterTo='translate-x-0'
                leave='transform transition ease-in-out duration-500 sm:duration-700'
                leaveFrom='translate-x-0'
                leaveTo='translate-x-full'
              >
                <Dialog.Panel className='pointer-events-auto relative flex flex-col w-full shadow-xl bg-white'>
                  <Dialog.Title className='sr-only'>{fileName}</Dialog.Title>
                  {/* Floating close button overlaid on the iframe's title bar */}
                  <button
                    type='button'
                    className='absolute top-1.5 right-3 z-20 rounded p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    onClick={() => setIsOpen(false)}
                  >
                    <span className='sr-only'>Close preview</span>
                    <XMarkIcon className='h-5 w-5' aria-hidden='true' />
                  </button>
                  {isLoading && (
                    <div className='absolute inset-0 z-10 flex items-center justify-center bg-white'>
                      <LoadingSpinner title='Loading preview...' />
                    </div>
                  )}
                  <iframe
                    key={previewUrl}
                    src={previewUrl}
                    title={fileName}
                    className='flex-1 w-full border-0 h-full'
                    style={{ minHeight: '100vh' }}
                    onLoad={() => setIsLoading(false)}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default FilePreviewPanel
