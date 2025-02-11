/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
// tables
import TablePagination from './TablePagination'
// overlays
import LoadingOverlay from '~/components/overlays/LoadingOverlay'

const DataTable: React.FC<any> = ({
  children,
  headers,
  pagination = null,
  isLoading = false,
}: any) => {
  let tablePagination = null

  if (pagination !== null) {
    const { totalItems, currentPage, totalPages, pageSize, nextPage, prevPage, gotoPage } =
      pagination

    tablePagination = (
      <TablePagination
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        prevPage={prevPage}
        nextPage={nextPage}
        gotoPage={gotoPage}
      />
    )
  }

  return (
    <>
      <div className='flex flex-col'>
        <div className='-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8'>
          <div className='py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8'>
            <div
              className='relative shadow overflow-hidden border-b border-gray-200 sm:rounded-lg'
              style={{
                minHeight: '200px',
              }}
            >
              {isLoading && <LoadingOverlay />}
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    {headers.map((header: any, idx: number) => (
                      <th
                        key={idx}
                        scope='col'
                        className={`relative px-6 py-3 ${
                          !header.srOnly
                            ? 'text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                            : ''
                        }`}
                      >
                        <span className={header.srOnly ? 'sr-only' : ''}>{header.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>{children}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {tablePagination}
    </>
  )
}

export default DataTable
