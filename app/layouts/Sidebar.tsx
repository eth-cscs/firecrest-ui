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
import AppLogo from '~/logos/AppLogo'
// mappers
import { serviceIconMapper } from '~/mappers/icon-mapper'
// contexts
import { useSystem } from '~/contexts/SystemContext'
// helpers
import { isSystemHealthy } from '~/helpers/system-helper'
// types
import { SystemHealtyStatus } from '~/types/api-status'

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: () => void
  logoPath: string | null
  appName: string | null
  supportUrl: string | null
  docUrl: string | null
  repoUrl: string | null
}

const Sidebar: React.FC<any> = ({
  sidebarOpen,
  setSidebarOpen,
  logoPath = null,
  appName = null,
  supportUrl = null,
  docUrl = null,
  repoUrl = null,
}: any) => {
  const location = useLocation()
  const { systems, selectedSystem } = useSystem()
  const userNavigation = [{ name: 'Dashboard', path: '/', icon: HomeIcon }]

  const getSystemHealthyStatusDotClass = (systemHealthyStatus: SystemHealtyStatus) => {
    switch (systemHealthyStatus) {
      case SystemHealtyStatus.healthy:
        return 'bg-green-500'
      case SystemHealtyStatus.degraded:
        return 'bg-yellow-400'
      case SystemHealtyStatus.unhealthy:
        return 'bg-red-500'
      default:
        return 'bg-gray-300'
    }
  }

  const primaryNavigation: any = [
    {
      name: LABEL_COMPUTE_TITLE,
      path: `/compute/systems/${selectedSystem?.name}`,
      icon: serviceIconMapper('compute'),
      systemHealthyStatus: isSystemHealthy(selectedSystem!),

      // children: systems.map((system) => {
      //   const systemHealthyStatus = isSystemHealthy(system)
      //   const disabled = systemHealthyStatus === SystemHealtyStatus.unhealthy
      //   return {
      //     name: system.name,
      //     path: '/compute/systems/' + system.name,
      //     systemHealthyStatus: systemHealthyStatus,
      //     disabled: disabled,
      //   }
      // }),
    },
    {
      name: LABEL_FILESYSTEM_TITLE,
      path: `/filesystems/systems/${selectedSystem?.name}`,
      icon: serviceIconMapper('filesystem'),
      systemHealthyStatus: isSystemHealthy(selectedSystem!),
      //   children: systems.map((system) => {
      //     const systemHealthyStatus = isSystemHealthy(system)
      //     const disabled = systemHealthyStatus === SystemHealtyStatus.unhealthy
      //     return {
      //       name: system.name,
      //       path: '/filesystems/systems/' + system.name,
      //       systemHealthyStatus: systemHealthyStatus,
      //       disabled: disabled,
      //     }
      //   }),
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
                <AppLogo className='h-12 w-auto' logoPath={logoPath} />
                <span className='ml-2 pr-5 relative'>{appName}</span>
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
                                  {/* <DisclosurePanel as='ul' className='mt-1 px-2'>
                                    {item.children.map((subItem: any) => {
                                      const isDisabled = subItem.disabled
                                      const statusDotClass = getSystemHealthyStatusDotClass(
                                        subItem.systemHealthyStatus,
                                      )
                                      return (
                                        <li key={`link-${subItem.path}`}>
                                          <DisclosureButton
                                            as={isDisabled ? 'div' : 'a'}
                                            href={isDisabled ? 'undefined' : subItem.path}
                                            disabled={isDisabled}
                                            className={classNames(
                                              'flex items-center justify-between rounded-md py-2 pr-2 pl-9 text-sm leading-6',
                                              isDisabled
                                                ? 'text-gray-400 cursor-not-allowed opacity-60'
                                                : isCurrentRootPath({
                                                      currentRootPath: subItem.path,
                                                    })
                                                  ? 'bg-gray-100 text-gray-900'
                                                  : 'hover:bg-gray-100 text-gray-900',
                                            )}
                                          >
                                            <span>{subItem.name}</span>
                                            <span
                                              className={classNames(
                                                'ml-3 h-2.5 w-2.5 rounded-full',
                                                statusDotClass,
                                              )}
                                            />
                                          </DisclosureButton>
                                        </li>
                                      )
                                    })}
                                  </DisclosurePanel> */}
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
            <AppLogo className='h-12 w-auto' logoPath={logoPath} />
            <span className='ml-2 pr-5 relative'>{appName}</span>
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
                              {/* <DisclosurePanel as='ul' className='mt-1 px-2'>
                                {item.children.map((subItem: any) => {
                                  const isDisabled = subItem.disabled
                                  const statusDotClass = getSystemHealthyStatusDotClass(
                                    subItem.systemHealthyStatus,
                                  )
                                  return (
                                    <li key={`link-${subItem.path}`}>
                                      <DisclosureButton
                                        as={isDisabled ? 'div' : 'a'}
                                        href={isDisabled ? undefined : subItem.path}
                                        disabled={isDisabled}
                                        className={classNames(
                                          'flex items-center justify-between rounded-md py-2 pr-2 pl-9 text-sm leading-6',
                                          isDisabled
                                            ? 'text-gray-400 cursor-not-allowed opacity-60'
                                            : isCurrentRootPath({ currentRootPath: subItem.path })
                                              ? 'bg-gray-100 text-gray-900'
                                              : 'hover:bg-gray-100 text-gray-900',
                                        )}
                                      >
                                        <span>{subItem.name}</span>
                                        <span
                                          className={classNames(
                                            'ml-3 h-2.5 w-2.5 rounded-full',
                                            statusDotClass,
                                          )}
                                        />
                                      </DisclosureButton>
                                    </li>
                                  )
                                })}
                              </DisclosurePanel> */}
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
