/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { Fragment, useState } from 'react'
import { Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
// types
import { NotificationMessageType } from '~/types/notification'
// texts
import NewLineText from '../texts/NewLineText'

const NotificationPanel: React.FC<any> = ({ message }: any) => {
  const [show, setShow] = useState(true)

  const getIcon = ({ message }: any) => {
    switch (message.type) {
      case NotificationMessageType.info:
        return <InformationCircleIcon className='h-6 w-6 text-blue-400' aria-hidden='true' />
      case NotificationMessageType.success:
        return <CheckCircleIcon className='h-6 w-6 text-green-400' aria-hidden='true' />
      case NotificationMessageType.warning:
        return <ExclamationCircleIcon className='h-6 w-6 text-yellow-500' aria-hidden='true' />
      default:
        return <XCircleIcon className='h-6 w-6 text-red-400' aria-hidden='true' />
    }
  }

  const autoDisappear = ({ message }: any) => {
    let disappearTime = 0
    if (message.disappear !== undefined) {
      disappearTime = message.disappear
    } else {
      switch (message.type) {
        case NotificationMessageType.info:
          disappearTime = 5000
          break
        case NotificationMessageType.success:
          disappearTime = 8000
          break
        case NotificationMessageType.warning:
          disappearTime = 15000
          break
        default:
          break
      }
    }
    if (disappearTime > 0) {
      setTimeout(() => {
        setShow(false)
      }, disappearTime)
    }
  }

  autoDisappear({
    message: message,
  })

  return (
    <>
      {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
      <Transition
        show={show}
        as={Fragment}
        enter='transform ease-out duration-300 transition'
        enterFrom='translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2'
        enterTo='translate-y-0 opacity-100 sm:translate-x-0'
        leave='transition ease-in duration-100'
        leaveFrom='opacity-100'
        leaveTo='opacity-0'
      >
        <div className='max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden'>
          <div className='p-4'>
            <div className='flex items-start'>
              <div className='flex-shrink-0'>{getIcon({ message: message })}</div>
              <div className='ml-3 w-0 flex-1 pt-0.5'>
                <div className='text-sm font-medium text-gray-900'>{message.title}</div>
                <div className='mt-1 text-sm text-gray-500'>
                  <NewLineText text={message.text} />
                </div>
              </div>
              <div className='ml-4 flex-shrink-0 flex'>
                <button
                  className='bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                  onClick={() => {
                    setShow(false)
                  }}
                >
                  <span className='sr-only'>Close</span>
                  <XMarkIcon className='h-5 w-5' aria-hidden='true' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </>
  )
}

export default NotificationPanel
