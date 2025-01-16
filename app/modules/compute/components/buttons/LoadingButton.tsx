import React from 'react'
// helpers
import { classNames } from '~/helpers/class-helper'

const LoadingButton: React.FC<any> = ({
  isLoading,
  children,
  className,
  buttonName = 'Loading...',
}: any) => {
  if (isLoading) {
    return (
      <button
        type='button'
        className={classNames(
          'inline-flex items-center py-2 px-3 border border-transparent text-xs leading-none font-medium rounded text-back bg-gray-300 hover:bg-gray-400 focus:border-gray-400 active:bg-gray-400 transition ease-in-out duration-150 cursor-not-allowed',
          className,
        )}
        disabled
      >
        <svg
          className='animate-spin -ml-1 mr-1 h-4 w-4 text-black'
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
        >
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          ></circle>
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          ></path>
        </svg>
        {buttonName}
      </button>
    )
  }

  return children
}

export default LoadingButton
