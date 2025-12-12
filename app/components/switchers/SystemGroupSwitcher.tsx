/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from '@remix-run/react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid'

// contexts
import { useSystem } from '~/contexts/SystemContext'

// hooks
import { useSystemAccountFromUrl } from '~/hooks/systemGroupHook'

// types
import { SystemHealtyStatus, type System, type Group } from '~/types/api-status'

// helpers
import { isSystemHealthy } from '~/helpers/system-helper'

type Selection = { systemName: string; groupName: string } | null

export enum SystemGroupSwitcherLayout {
  vertical = 'vertical',
  horizontal = 'horizontal',
}

const STATUS_DOT_CLASSES: Record<SystemHealtyStatus, string> = {
  [SystemHealtyStatus.healthy]: 'bg-emerald-500',
  [SystemHealtyStatus.degraded]: 'bg-amber-400',
  [SystemHealtyStatus.unhealthy]: 'bg-red-500',
}

const STATUS_LABEL: Record<SystemHealtyStatus, string> = {
  [SystemHealtyStatus.healthy]: 'Healthy',
  [SystemHealtyStatus.degraded]: 'Degraded',
  [SystemHealtyStatus.unhealthy]: 'Unhealthy',
}

function resolveBasePath(pathname: string): '/compute' | '/filesystems' {
  return pathname.startsWith('/filesystems') ? '/filesystems' : '/compute'
}

export const SystemGroupSwitcher: React.FC<{
  label?: string
  placeholder?: string
  className?: string
  layout?: SystemGroupSwitcherLayout
  disableUnhealthySystems?: boolean
  closeOnSelect?: boolean
  onChange?: (value: Selection) => void
}> = ({
  label = 'System / account',
  placeholder = 'Select system / account',
  className = '',
  layout = SystemGroupSwitcherLayout.vertical,
  disableUnhealthySystems = true,
  closeOnSelect = true,
  onChange,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { systems } = useSystem()
  const { systemName, accountName } = useSystemAccountFromUrl()
  const basePath = useMemo(() => resolveBasePath(location.pathname), [location.pathname])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('') // ✅ NEW
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const selected: Selection = useMemo(() => {
    if (!systemName || !accountName) return null
    return { systemName, groupName: accountName }
  }, [systemName, accountName])

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const selectedLabel = useMemo(() => {
    if (!selected) return placeholder
    const sys = systems.find((s: System) => s.name === selected.systemName)
    const grp = sys?.groups?.find((g: Group) => g.name === selected.groupName)
    return sys && grp ? `${sys.name} • ${grp.name}` : placeholder
  }, [selected, systems, placeholder])

  const handleSelect = (systemName: string, groupName: string, disabled: boolean) => {
    if (disabled) return
    const value: Selection = { systemName, groupName }
    onChange?.(value)
    if (closeOnSelect) setOpen(false)
    navigate(`${basePath}/systems/${systemName}/accounts/${groupName}`)
  }

  const isHorizontal = layout === SystemGroupSwitcherLayout.horizontal

  const filteredSystems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return systems
    return systems
      .map((sys: System) => {
        const sysName = (sys.name ?? '').toLowerCase()
        const sysMatches = sysName.includes(q)
        if (sysMatches) {
          return sys
        }
        const groups = (sys.groups ?? []).filter((g: Group) =>
          (g.name ?? '').toLowerCase().includes(q),
        )
        return { ...sys, groups }
      })
      .filter((sys: System) => {
        const sysMatches = (sys.name ?? '').toLowerCase().includes(q)
        return sysMatches || (sys.groups?.length ?? 0) > 0
      })
  }, [systems, search])

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
          {label}
        </div>
        <button
          type='button'
          onClick={() => setOpen((v) => !v)}
          className='flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500'
        >
          <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
            {selectedLabel}
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
              className='w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-gray-500'
            />
          </div>
          {(filteredSystems ?? []).map((sys: System) => {
            const status = isSystemHealthy(sys)
            const disabledSystem =
              disableUnhealthySystems && status === SystemHealtyStatus.unhealthy
            return (
              <div key={sys.name} className='border-b last:border-b-0'>
                <div className='flex items-center justify-between bg-gray-50 px-3 py-2'>
                  <div className='flex items-center gap-2'>
                    <span
                      className={`inline-flex h-2.5 w-2.5 rounded-full ${STATUS_DOT_CLASSES[status]}`}
                    />
                    <span className='font-medium text-gray-800'>{sys.name}</span>
                  </div>
                  <span className='text-[11px] font-medium uppercase tracking-wide text-gray-500'>
                    {STATUS_LABEL[status]}
                  </span>
                </div>
                <ul className='py-1'>
                  {sys.groups?.map((g: Group) => {
                    const isSelected =
                      selected?.systemName === sys.name && selected?.groupName === g.name

                    return (
                      <li key={g.name}>
                        <button
                          disabled={disabledSystem}
                          onClick={() => handleSelect(sys.name, g.name, disabledSystem)}
                          className={[
                            'flex w-full items-center justify-between px-3 py-1.5 text-sm',
                            disabledSystem
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'hover:bg-gray-100',
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

                {disabledSystem && (
                  <div className='px-3 pb-2 text-[11px] text-gray-400 italic'>
                    This system is unhealthy. Accounts cannot be selected.
                  </div>
                )}
              </div>
            )
          })}
          {filteredSystems.length === 0 && (
            <div className='px-3 py-3 text-sm text-gray-500'>No accounts match “{search}”.</div>
          )}
        </div>
      )}
    </div>
  )
}
