/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useNavigate } from '@remix-run/react'
import { createPortal } from 'react-dom'
import React, { useEffect, useState,useMemo,useRef } from 'react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
// types
import { SystemHealtyStatus, type System, type Group } from '~/types/api-status'

// contexts
import { useGroup } from '~/contexts/GroupContext'

interface GroupSwitcherPortalProps {
  systemName: string
  basePath: '/compute' | '/filesystems'
  layout: GroupSwitcherLayout
  className?: string
}



export const GroupSwitcherPortal: React.FC<GroupSwitcherPortalProps> = ({
  systemName,
  basePath,
  layout,
  className
}) => {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    const el = document.getElementById('app-header-slot')
    setTarget(el)
  }, [])
  if (!target) return null
  return createPortal(<GroupSwitcher systemName={systemName} basePath={basePath} layout={layout} className={className} />, target)
}
export enum GroupSwitcherLayout {
  vertical = 'vertical',
  horizontal = 'horizontal',
}

interface GroupSwitcherProps {
  systemName: string
  basePath: '/compute' | '/filesystems'
  layout?: GroupSwitcherLayout
  className?: string
}

export const GroupSwitcher: React.FC<GroupSwitcherProps> = ({
  systemName,
  basePath,
  layout = GroupSwitcherLayout.horizontal,
  className = '',
}: GroupSwitcherProps) => {
  const navigate = useNavigate()
  const { groups, selectedGroup, setSelectedGroupName } = useGroup()
  const handleSwitch = (groupName: string) => {
    setSelectedGroupName(groupName)
    const group = groups.find((g) => g.name === groupName)
    if (!group || !systemName) return
    setOpen(false)
    navigate(`${basePath}/systems/${systemName}/accounts/${group.name}`)
  }
  const isHorizontal = layout === GroupSwitcherLayout.horizontal
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups
      .filter((g: Group) => {
        return (g.name ?? '').toLowerCase().includes(q)
     
      })
  }, [groups, search])

  
  
  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className={isHorizontal ? 'flex items-center gap-2' : 'w-full'}>
        <div
          className={
            isHorizontal
              ? 'text-sm font-medium text-gray-600 whitespace-nowrap'
              : 'mb-1 text-xs font-medium text-gray-500'
          }
        >
          Account
        </div>
        <button
          type='button'
          onClick={() => setOpen((v) => !v)}
          className='flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500'
        >
          <span className={`truncate text-gray-900`}>
            {selectedGroup?.name}
          </span>
          <ChevronDownIcon className='h-4 w-4 text-gray-400' />
        </button>
      </div>
      {open && (
        <div className='absolute z-20 mt-1 w-full max-h-80 overflow-y-auto rounded-md border bg-white shadow-lg'>
          <div className='sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-2'>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search accounts...'
              className='w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-300 focus:ring-blue-300'
            />
          </div>

                <ul className='py-1'>
                  {filteredGroups?.map((g: Group) => {
                    const isSelected =
                      selectedGroup?.name === g.name

                    return (
                      <li key={g.name}>
                        <button
                          onClick={() => handleSwitch(g.name)}
                          className={[
                            'flex w-full items-center justify-between px-3 py-1.5 text-sm',
                              'hover:bg-gray-100',
                            isSelected ? 'bg-gray-100 font-medium' : '',
                          ].join(' ')}
                        >
                          <span>{g.name}</span>
                          {isSelected && <CheckIcon className='h-4 w-4 text-gray-700' />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
        </div>
      )}
    </div>
  )


  return (
    <>
      <div className='flex items-center gap-2'>
        <span className='text-sm text-gray-600'>Account</span>
        <select
          value={selectedGroup?.name ?? ''}
          onChange={(e) => handleSwitch(e.target.value)}
          className='block rounded-md border-gray-300 focus:border-gray-500 focus:ring-gray-500 bg-white py-2 pl-2 pr-6 text-sm shadow-sm cursor-pointer'
        >
          {groups.map((g) => (
            <option key={g.name} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <div className='h-6 w-px bg-gray-300 ml-8 mr-0'></div>
    </>
  )
}



