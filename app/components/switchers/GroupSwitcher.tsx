/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useNavigate } from '@remix-run/react'
import { createPortal } from 'react-dom'
import React, { useEffect, useState } from 'react'

// contexts
import { useGroup } from '~/contexts/GroupContext'

interface GroupSwitcherPortalProps {
  systemName: string
  basePath: '/compute' | '/filesystems'
}

export const GroupSwitcherPortal: React.FC<GroupSwitcherPortalProps> = ({
  systemName,
  basePath,
}) => {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    const el = document.getElementById('app-header-slot')
    setTarget(el)
  }, [])
  if (!target) return null
  return createPortal(<GroupSwitcher systemName={systemName} basePath={basePath} />, target)
}

interface GroupSwitcherProps {
  systemName: string
  basePath: '/compute' | '/filesystems'
}

export const GroupSwitcher: React.FC<GroupSwitcherProps> = ({
  systemName,
  basePath,
}: GroupSwitcherProps) => {
  const navigate = useNavigate()
  const { groups, selectedGroup, setSelectedGroupName } = useGroup()
  const handleSwitch = (groupName: string) => {
    setSelectedGroupName(groupName)
    const group = groups.find((g) => g.name === groupName)
    if (!group || !systemName) return
    navigate(`${basePath}/systems/${systemName}/accounts/${group.name}`)
  }
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
