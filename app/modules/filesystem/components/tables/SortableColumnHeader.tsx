/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
// types
import { SortableColumn, ColumnType } from '~/types/ui-tables'

const SortableColumnHeader: React.FC<any> = ({ fileTableSortableColumn, changeSorting }) => {
  const sortingIcon = (sortableColumn: SortableColumn) => {
    switch (sortableColumn) {
      case SortableColumn.UP:
        return <ChevronUpIcon className='h-5 w-5' aria-hidden='true' />
      case SortableColumn.DOWN:
        return <ChevronDownIcon className='h-5 w-5' aria-hidden='true' />
      default:
        return <ChevronUpIcon className='h-5 w-5 invisible' aria-hidden='true' />
    }
  }
  if (fileTableSortableColumn.columnType === ColumnType.ACTION) {
    return (
      <th className='px-4 py-3 font-normal text-right'>{fileTableSortableColumn.columnLabel}</th>
    )
  }
  return (
    <>
      <th className='px-4 py-3 font-normal'>
        <button
          onClick={() => changeSorting(fileTableSortableColumn)}
          className='inline-flex cursor-pointer'
        >
          {fileTableSortableColumn.columnLabel}
          <span className='ml-2 flex-none rounded bg-gray-100 text-gray-900 '>
            {sortingIcon(fileTableSortableColumn.columnSortable)}
          </span>
        </button>
      </th>
    </>
  )
}

export default SortableColumnHeader
