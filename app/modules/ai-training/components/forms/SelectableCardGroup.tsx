/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
// helpers
import { classNames } from '~/helpers/class-helper'

export interface SelectableCardOption {
  id: string
  title: string
  description?: string
  badges?: string[]
  footer?: React.ReactNode
}

export interface RequestCardProps {
  title: string
  description: string
  href: string
}

// A link styled as a card, placed after the options, for asking for more of them
export const RequestCard: React.FC<RequestCardProps> = ({ title, description, href }) => (
  <a
    href={href}
    target='_blank'
    rel='noopener noreferrer'
    className='relative flex min-w-0 flex-col rounded-lg border border-dashed border-gray-300 bg-white p-4 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500'
  >
    <span className='flex items-start justify-between gap-x-2'>
      <span className='min-w-0 text-sm font-medium text-gray-900'>{title}</span>
      <ArrowTopRightOnSquareIcon aria-hidden='true' className='h-5 w-5 shrink-0 text-gray-400' />
    </span>
    <span className='mt-2 text-sm text-gray-500'>{description}</span>
    <span className='sr-only'>(opens in a new tab)</span>
  </a>
)

interface SelectableCardGroupProps {
  name: string
  label: string
  options: SelectableCardOption[]
  selectedId: string | null
  onSelect: (id: string) => void
  requestCard?: RequestCardProps
}

const SelectableCardGroup: React.FC<SelectableCardGroupProps> = ({
  name,
  label,
  options,
  selectedId,
  onSelect,
  requestCard,
}: SelectableCardGroupProps) => {
  return (
    // relative: keeps the visually hidden legend inside the scrolling content, otherwise it is
    // positioned against the page and stretches it, adding a second scrollbar
    <fieldset className='relative'>
      <legend className='sr-only'>{label}</legend>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {options.map((option: SelectableCardOption) => {
          const isSelected = option.id === selectedId
          return (
            <label
              key={option.id}
              className={classNames(
                isSelected
                  ? 'border-emerald-500 ring-1 ring-emerald-500'
                  : 'border-gray-300 hover:border-gray-400',
                'relative flex min-w-0 cursor-pointer flex-col rounded-lg border bg-white p-4 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500',
              )}
            >
              <input
                type='radio'
                name={name}
                value={option.id}
                checked={isSelected}
                onChange={() => onSelect(option.id)}
                className='sr-only'
              />
              <span className='flex items-start justify-between gap-x-2'>
                <span className='min-w-0 text-sm font-medium text-gray-900'>{option.title}</span>
                <CheckCircleIcon
                  aria-hidden='true'
                  className={classNames(
                    isSelected ? 'text-emerald-500' : 'invisible',
                    'h-5 w-5 shrink-0',
                  )}
                />
              </span>
              {option.badges && option.badges.length > 0 && (
                <span className='mt-2 flex flex-wrap gap-1'>
                  {option.badges.map((badge: string) => (
                    // Badges can be long paths without spaces: they wrap anywhere rather than
                    // overflow the card
                    <span
                      key={badge}
                      className='inline-flex max-w-full items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 [overflow-wrap:anywhere]'
                    >
                      {badge}
                    </span>
                  ))}
                </span>
              )}
              {option.description && (
                <span className='mt-2 text-sm text-gray-500'>{option.description}</span>
              )}
              {option.footer && <span className='mt-3 text-xs'>{option.footer}</span>}
            </label>
          )
        })}
        {requestCard && <RequestCard {...requestCard} />}
      </div>
    </fieldset>
  )
}

export default SelectableCardGroup
