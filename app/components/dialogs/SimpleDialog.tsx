/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { Fragment, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
// helpers
import { classNames } from '~/helpers/class-helper'

export enum SimpleDialogSize {
  DEFAULT = 0,
  SMALL = 1,
  MEDIUM = 2,
  LARGE = 3,
  XLARGE = 4,
}

const getMaxWitdh = (size: SimpleDialogSize) => {
  switch (size) {
    case SimpleDialogSize.MEDIUM:
      return 'sm:max-w-3xl'
    case SimpleDialogSize.LARGE:
      return 'sm:max-w-4xl'
    case SimpleDialogSize.XLARGE:
      return 'sm:max-w-5xl'
    default:
      return 'sm:max-w-lg'
  }
}

const SimpleDialog: React.FC<any> = ({
  children,
  title,
  subtitle,
  open,
  onClose,
  size = SimpleDialogSize.DEFAULT,
  actionButtons = null,
  isLoading = false,
  closeButtonName = 'Cancel',
}: any) => {
  const cancelButtonRef = useRef(null)

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as='div' className='relative z-10' initialFocus={cancelButtonRef} onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
          </Transition.Child>
          <div className='fixed inset-0 z-10 overflow-y-auto'>
            <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
                enterTo='opacity-100 translate-y-0 sm:scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 translate-y-0 sm:scale-100'
                leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
              >
                <Dialog.Panel
                  className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full ${getMaxWitdh(
                    size,
                  )}`}
                >
                  <div
                    className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:align-middle ${getMaxWitdh(
                      size,
                    )} sm:w-full`}
                  >
                    <div className='px-4 py-5 sm:px-6'>
                      <Dialog.Title as='h3' className='text-lg leading-6 font-medium text-gray-900'>
                        {title}
                      </Dialog.Title>
                      {subtitle && (
                        <p className='mt-1 max-w-2xl text-sm text-gray-500'>{subtitle}</p>
                      )}
                    </div>
                    <div className='border-t border-gray-200 px-4 py-5 sm:px-6'>{children}</div>
                    <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                      {actionButtons}
                      <button
                        type='button'
                        className={classNames(
                          !isLoading ? '' : 'opacity-50 cursor-not-allowed',
                          'mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto',
                        )}
                        onClick={onClose}
                        ref={cancelButtonRef}
                        disabled={isLoading}
                      >
                        {closeButtonName}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}

export default SimpleDialog
