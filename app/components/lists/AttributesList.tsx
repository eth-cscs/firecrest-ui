/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { ReactNode } from 'react'

interface AttributesListItemProps {
  label: string
  children: ReactNode
}

interface AttributesListProps {
  children: React.ReactElement<AttributesListItemProps>[]
  className?: string
}

const AttributesList: React.FC<AttributesListProps> = ({
  children,
  className = '',
}: AttributesListProps) => {
  return (
    <div className={className}>
      <dl className='divide-y divide-gray-100'>
        {React.Children.map(children, (child, index) => (
          <div key={index} className='py-2 sm:grid sm:grid-cols-3 sm:gap-4'>
            <dt className='text-sm font-medium text-gray-900'>{child.props.label}</dt>
            <dd className='mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0'>{child}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const AttributesListItem: React.FC<AttributesListItemProps> = ({
  children,
}: AttributesListItemProps) => {
  return <div>{children}</div>
}

export { AttributesList, AttributesListItem }
