/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { Fragment } from 'react'
import { Link } from '@remix-run/react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, Bars3BottomLeftIcon } from '@heroicons/react/24/outline'
// logos
import AppLogo from '~/logos/AppLogo'
// switchers
import {
  SystemGroupSwitcher,
  SystemGroupSwitcherLayout,
} from '~/components/switchers/SystemGroupSwitcher'

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void
  authUser: any
  fixed?: boolean
  hasRightSidebar?: boolean
  withLogo?: boolean
  logoPath?: string | null
  appName?: string | null
}

const Header: React.FC<HeaderProps> = ({
  setSidebarOpen,
  authUser,
  fixed = false,
  hasRightSidebar = false,
  withLogo = false,
  logoPath = null,
  appName = '',
}: HeaderProps) => {
  return (
    <div
      className={`top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow ${fixed ? 'fixed right-0 left-64' : 'sticky'}`}
    >
      <button
        type='button'
        className='px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500 md:hidden'
        onClick={() => setSidebarOpen(true)}
      >
        <span className='sr-only'>Open sidebar</span>
        <Bars3BottomLeftIcon className='h-6 w-6' aria-hidden='true' />
      </button>
      <div className='flex-1 px-4 flex justify-between'>
        <div className='flex-1 flex items-center gap-4'>
          {withLogo && (
            <div className='flex items-center'>
              <AppLogo className='h-12 w-auto' logoPath={logoPath} />
              <span className='ml-2 pr-5 text-sm font-medium text-gray-700'>{appName}</span>
            </div>
          )}
        </div>
        <div className='ml-4 flex items-center gap-4 md:ml-6'>
          {/* System/Account switcher */}
          <SystemGroupSwitcher
            layout={SystemGroupSwitcherLayout.horizontal}
            className='hidden lg:block w-[360px]'
            label='System / Account'
            placeholder='Select System / Account'
          />
          <div className='h-6 ml-2 w-px bg-gray-300' aria-hidden='true' />
          {/* Slot to insert additional components */}
          {/* <div id='app-header-slot' className='flex items-center' /> */}
          {/* Divider */}
          {/* Profile dropdown */}
          <Menu as='div' className='relative'>
            <div>
              <Menu.Button className='max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 lg:py-2 lg:rounded-md lg:hover:bg-gray-50'>
                <span className='hidden ml-3 text-gray-700 text-sm font-medium lg:block'>
                  <span className='sr-only'>Open user menu for </span>
                  <span>
                    {authUser.firstName} {authUser.lastName} ({authUser.username})
                  </span>
                </span>
                <ChevronDownIcon
                  className='hidden flex-shrink-0 ml-1 h-5 w-5 text-gray-400 lg:block'
                  aria-hidden='true'
                />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter='transition ease-out duration-100'
              enterFrom='transform opacity-0 scale-95'
              enterTo='transform opacity-100 scale-100'
              leave='transition ease-in duration-75'
              leaveFrom='transform opacity-100 scale-100'
              leaveTo='transform opacity-0 scale-95'
            >
              <Menu.Items className='origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none'>
                <Menu.Item key='logout'>
                  <Link
                    to='/logout/sso'
                    className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                    reloadDocument
                  >
                    Logout
                  </Link>
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  )
}

export default Header
