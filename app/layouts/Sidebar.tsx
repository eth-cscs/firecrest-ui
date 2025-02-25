/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { Fragment } from 'react'
import { Link } from '@remix-run/react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Dialog,
  DialogBackdrop,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import {
  HomeIcon,
  XMarkIcon,
  DocumentTextIcon,
  ChatBubbleLeftEllipsisIcon,
  CubeTransparentIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
// labels
import { LABEL_COMPUTE_TITLE, LABEL_FILESYSTEM_TITLE } from '~/labels'
// utils
import { classNames } from '~/helpers/class-helper'
// logos
import LogoFirecREST from '~/logos/LogoFirecREST'
// mappers
import { serviceIconMapper } from '~/mappers/icon-mapper'

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: () => void
  supportUrl: string | null
  docUrl: string | null
  repoUrl: string | null
}

const Sidebar: React.FC<any> = ({
  sidebarOpen,
  setSidebarOpen,
  supportUrl = null,
  docUrl = null,
  repoUrl = null,
}: any) => {
  const location = useLocation()

  const userNavigation = [{ name: 'Dashboard', path: '/', icon: HomeIcon }]

  const primaryNavigation: any = [
    { name: LABEL_COMPUTE_TITLE, path: '/compute', icon: serviceIconMapper('compute') },
    {
      name: LABEL_FILESYSTEM_TITLE,
      path: '/filesystems',
      icon: serviceIconMapper('filesystem'),
    },
  ]

  const secondaryNavigation: any = []

  if (docUrl && docUrl !== '') {
    secondaryNavigation.push({
      name: 'Documentation',
      url: docUrl,
      icon: DocumentTextIcon,
    })
  }

  if (repoUrl && repoUrl !== '') {
    secondaryNavigation.push({
      name: 'Github repo',
      url: repoUrl,
      icon: CubeTransparentIcon,
    })
  }

  if (supportUrl && supportUrl !== '') {
    secondaryNavigation.push({
      name: 'Get support',
      url: supportUrl,
      icon: ChatBubbleLeftEllipsisIcon,
    })
  }

  const isCurrentPath = ({ currentPath }: any) => {
    const path = location.pathname
    return path === currentPath
  }

  const isCurrentRootPath = ({ currentRootPath }: any) => {
    const path: string = location.pathname
    return path.includes(currentRootPath)
  }

  return (
    <>
      <Transition show={sidebarOpen} as={Fragment}>
        <Dialog as='div' className='fixed inset-0 flex z-40 md:hidden' onClose={setSidebarOpen}>
          <TransitionChild
            as={Fragment}
            enter='transition-opacity ease-linear duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='transition-opacity ease-linear duration-300'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <DialogBackdrop className='fixed inset-0 bg-gray-600 bg-opacity-75' />
          </TransitionChild>
          <TransitionChild
            as={Fragment}
            enter='transition ease-in-out duration-300 transform'
            enterFrom='-translate-x-full'
            enterTo='translate-x-0'
            leave='transition ease-in-out duration-300 transform'
            leaveFrom='translate-x-0'
            leaveTo='-translate-x-full'
          >
            <div className='relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white'>
              <TransitionChild
                as={Fragment}
                enter='ease-in-out duration-300'
                enterFrom='opacity-0'
                enterTo='opacity-100'
                leave='ease-in-out duration-300'
                leaveFrom='opacity-100'
                leaveTo='opacity-0'
              >
                <div className='absolute top-0 right-0 -mr-12 pt-2'>
                  <button
                    type='button'
                    className='ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className='sr-only'>Close sidebar</span>
                    <XMarkIcon className='h-6 w-6 text-white' aria-hidden='true' />
                  </button>
                </div>
              </TransitionChild>
              <div className='flex-shrink-0 flex items-center px-4'>
                <LogoFirecREST className='h-12 w-auto' />
                <span className='ml-2 pr-5 relative'>
                  FirecREST Web UI{' '}
                  <span className='absolute top-0 end-0 inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-1/2 bg-blue-500 text-white'>
                    v2
                  </span>
                </span>
              </div>
              <div className='mt-5 flex-1 h-0 overflow-y-auto'>
                <nav className='px-2 space-y-6 divide-y'>
                  <ul className='space-y-1'>
                    {userNavigation.map((item) => (
                      <li key={`link-${item.path}`}>
                        <NavLink
                          to={item.path}
                          className={({ isActive }: any) =>
                            isActive
                              ? 'bg-gray-100 text-gray-900 group flex items-center px-2 py-2 text-base font-medium rounded-md'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-base font-medium rounded-md'
                          }
                        >
                          <item.icon
                            className={classNames(
                              isCurrentPath({ currentPath: item.path })
                                ? 'text-gray-500'
                                : 'text-gray-400 group-hover:text-gray-500',
                              'mr-4 flex-shrink-0 h-6 w-6',
                            )}
                            aria-hidden='true'
                          />
                          {item.name}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                  <div className='mt-2 pt-2'>
                    <ul className='space-y-1'>
                      {primaryNavigation.map((item: any) => (
                        <li key={`link-${item.path}`}>
                          {'children' in item && item.children ? (
                            <Disclosure
                              as='div'
                              defaultOpen={isCurrentRootPath({ currentRootPath: item.path })}
                            >
                              {({ open }) => (
                                <>
                                  <DisclosureButton
                                    className={classNames(
                                      isCurrentRootPath({ currentRootPath: item.path })
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 ',
                                      'group flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm font-medium',
                                    )}
                                  >
                                    <item.icon
                                      className={classNames(
                                        isCurrentRootPath({ currentRootPath: item.path })
                                          ? 'text-gray-500'
                                          : 'text-gray-400 group-hover:text-gray-500',
                                        'h-6 w-6 shrink-0 ',
                                      )}
                                      aria-hidden='true'
                                    />
                                    {item.name}
                                    <ChevronRightIcon
                                      className={classNames(
                                        open ? 'rotate-90 text-gray-500' : 'text-gray-400',
                                        'ml-auto h-5 w-5 shrink-0',
                                      )}
                                      aria-hidden='true'
                                    />
                                  </DisclosureButton>
                                  <DisclosurePanel as='ul' className='mt-1 px-2'>
                                    {item.children.map((subItem: any) => (
                                      <li key={`link-${subItem.path}`}>
                                        <DisclosureButton
                                          as='a'
                                          href={subItem.path}
                                          className={classNames(
                                            isCurrentRootPath({ currentRootPath: subItem.path })
                                              ? 'bg-gray-100'
                                              : 'hover:bg-gray-100',
                                            'block rounded-md py-2 pr-2 pl-9 text-sm leading-6 text-gray-900',
                                          )}
                                        >
                                          {subItem.name}
                                        </DisclosureButton>
                                      </li>
                                    ))}
                                  </DisclosurePanel>
                                </>
                              )}
                            </Disclosure>
                          ) : (
                            <NavLink
                              to={item.path}
                              className={({ isActive }: any) =>
                                isActive
                                  ? 'bg-gray-100 text-gray-900 group flex items-center px-2 py-2 text-base font-medium rounded-md'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-base font-medium rounded-md'
                              }
                            >
                              <item.icon
                                className={classNames(
                                  isCurrentPath({ currentPath: item.path })
                                    ? 'text-gray-500'
                                    : 'text-gray-400 group-hover:text-gray-500',
                                  'mr-4 flex-shrink-0 h-6 w-6',
                                )}
                                aria-hidden='true'
                              />
                              {item.name}
                            </NavLink>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className='mt-6 pt-6'>
                    <ul className='space-y-1'>
                      {secondaryNavigation.map((item: any) => (
                        <li key={`link-${item.name}`}>
                          <Link
                            to={item.url}
                            className={
                              'text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-base font-medium rounded-md'
                            }
                            target='_blank'
                            rel='noreferrer'
                          >
                            <item.icon
                              className={
                                'text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6'
                              }
                              aria-hidden='true'
                            />
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </nav>
              </div>
            </div>
          </TransitionChild>
          <div className='flex-shrink-0 w-14' aria-hidden='true'>
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </Dialog>
      </Transition>
      {/* Static sidebar for desktop */}
      <div className='hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0'>
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className='flex flex-col flex-grow border-r border-gray-200 pt-2 bg-white overflow-y-auto'>
          <div className='flex items-center flex-shrink-0 px-4'>
            <LogoFirecREST className='h-12 w-auto' />
            <span className='ml-2 pr-5 relative'>
              FirecREST Web UI{' '}
              <span className='absolute top-0 end-0 inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-1/2 bg-blue-500 text-white'>
                v2
              </span>
            </span>
          </div>
          <div className='mt-5 flex-grow flex flex-col'>
            <nav className='flex-1 px-2 pb-4 space-y-6 divide-y'>
              <ul className='space-y-1'>
                {userNavigation.map((item: any) => (
                  <li key={`link-${item.path}`}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }: any) =>
                        isActive
                          ? 'bg-gray-100 text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                      }
                    >
                      <item.icon
                        className={classNames(
                          isCurrentPath({ currentPath: item.path })
                            ? 'text-gray-500'
                            : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 flex-shrink-0 h-6 w-6',
                        )}
                        aria-hidden='true'
                      />
                      {item.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className='mt-2 pt-2'>
                <ul className='space-y-1'>
                  {primaryNavigation.map((item: any) => (
                    <li key={`link-${item.path}`}>
                      {'children' in item && item.children ? (
                        <Disclosure
                          as='div'
                          defaultOpen={isCurrentRootPath({ currentRootPath: item.path })}
                        >
                          {({ open }) => (
                            <>
                              <DisclosureButton
                                className={classNames(
                                  isCurrentRootPath({ currentRootPath: item.path })
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 ',
                                  'group flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm font-medium',
                                )}
                              >
                                <item.icon
                                  className={classNames(
                                    isCurrentRootPath({ currentRootPath: item.path })
                                      ? 'text-gray-500'
                                      : 'text-gray-400 group-hover:text-gray-500',
                                    'h-6 w-6 shrink-0 ',
                                  )}
                                  aria-hidden='true'
                                />
                                {item.name}
                                <ChevronRightIcon
                                  className={classNames(
                                    open ? 'rotate-90 text-gray-500' : 'text-gray-400',
                                    'ml-auto h-5 w-5 shrink-0',
                                  )}
                                  aria-hidden='true'
                                />
                              </DisclosureButton>
                              <DisclosurePanel as='ul' className='mt-1 px-2'>
                                {item.children.map((subItem: any) => (
                                  <li key={`link-${subItem.path}`}>
                                    <DisclosureButton
                                      as='a'
                                      href={subItem.path}
                                      className={classNames(
                                        isCurrentRootPath({ currentRootPath: subItem.path })
                                          ? 'bg-gray-100'
                                          : 'hover:bg-gray-100',
                                        'block rounded-md py-2 pr-2 pl-9 text-sm leading-6 text-gray-900',
                                      )}
                                    >
                                      {subItem.name}
                                    </DisclosureButton>
                                  </li>
                                ))}
                              </DisclosurePanel>
                            </>
                          )}
                        </Disclosure>
                      ) : (
                        <NavLink
                          to={item.path}
                          className={({ isActive }: any) =>
                            isActive
                              ? 'bg-gray-100 text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                          }
                        >
                          <item.icon
                            className={classNames(
                              isCurrentPath({ currentPath: item.path })
                                ? 'text-gray-500'
                                : 'text-gray-400 group-hover:text-gray-500',
                              'mr-3 flex-shrink-0 h-6 w-6',
                            )}
                            aria-hidden='true'
                          />
                          {item.name}
                        </NavLink>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className='mt-6 pt-6'>
                <ul className='space-y-1'>
                  {secondaryNavigation.map((item: any) => (
                    <li key={`link-${item.name}`}>
                      <Link
                        to={item.url}
                        className={
                          'text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                        }
                        target='_blank'
                        rel='noreferrer'
                      >
                        <item.icon
                          className={
                            'text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6'
                          }
                          aria-hidden='true'
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
