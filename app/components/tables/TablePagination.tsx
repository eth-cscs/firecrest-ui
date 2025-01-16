import React from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/solid'
// utils
import { classNames } from '~/helpers/class-helper'

const PageButton: React.FC<any> = ({ children, className, ...rest }: any) => {
  return (
    <button
      type='button'
      className={classNames(
        'relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

const TablePagination: React.FC<any> = ({
  totalItems,
  currentPage,
  totalPages,
  pageSize,
  prevPage,
  nextPage,
  gotoPage,
}: any) => {
  const canPreviousPage = currentPage > 1
  const canNextPage = currentPage < totalPages

  return (
    <div className='py-3 flex items-center justify-between'>
      <div className='flex-1 flex justify-between sm:hidden'>
        <a
          href='#'
          className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
        >
          Previous
        </a>
        <a
          href='#'
          className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
        >
          Next
        </a>
      </div>
      <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm text-gray-700'>
            Page <span className='font-medium'>{currentPage}</span> of{' '}
            <span className='font-medium'>{totalPages}</span> -{' '}
            <span className='font-medium'>{totalItems}</span> results{' '}
            <i className='text-gray-400'>
              (<span className='font-medium'>{pageSize}</span> per page)
            </i>
          </p>
        </div>
        <div>
          <nav
            className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'
            aria-label='Pagination'
          >
            <PageButton
              className={`${
                !canPreviousPage ? 'rounded-l-md opacity-50 cursor-not-allowed' : 'rounded-l-md'
              }`}
              onClick={() => gotoPage(1)}
              disabled={!canPreviousPage}
            >
              <span className='sr-only'>First</span>
              <ChevronDoubleLeftIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
            </PageButton>
            <PageButton
              onClick={() => prevPage()}
              className={`${!canPreviousPage ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canPreviousPage}
            >
              <span className='sr-only'>Previous</span>
              <ChevronLeftIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
            </PageButton>
            <PageButton
              onClick={() => nextPage()}
              className={`${!canNextPage ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canNextPage}
            >
              <span className='sr-only'>Next</span>
              <ChevronRightIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
            </PageButton>
            <PageButton
              className={`${
                !canNextPage ? 'rounded-r-md opacity-50 cursor-not-allowed' : 'rounded-r-md'
              }`}
              onClick={() => gotoPage(totalPages)}
            >
              <span className='sr-only'>Last</span>
              <ChevronDoubleRightIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
            </PageButton>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default TablePagination
