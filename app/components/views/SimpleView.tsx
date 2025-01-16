import React from 'react'

export enum SimpleViewSize {
  DEFAULT = 0,
  SMALL = 1,
  MEDIUM = 2,
  LARGE = 3,
  FULL = 4,
}

const getMaxWitdh = (size: SimpleViewSize) => {
  switch (size) {
    case SimpleViewSize.FULL:
      return ''
    default:
      return 'max-w-7xl'
  }
}

const SimpleView: React.FC<any> = ({
  children,
  title,
  size = SimpleViewSize.DEFAULT,
  headerActionButtons = null,
  footerActionButtons = null,
}: any) => {
  return (
    <div className='py-6'>
      <div
        className={`${getMaxWitdh(
          size,
        )} mx-auto px-4 sm:px-6 md:px-8 md:flex md:items-center md:justify-between`}
      >
        <div className='min-w-0 flex-1'>
          <h1 className='text-2xl font-semibold text-gray-900'>{title}</h1>
        </div>
        {headerActionButtons && (
          <div className='mt-4 flex flex-shrink-0 md:ml-4 md:mt-0'>{headerActionButtons}</div>
        )}
      </div>
      <div className={`${getMaxWitdh(size)} mx-auto px-4 sm:px-6 md:px-8 pt-4`}>{children}</div>
      {footerActionButtons && (
        <div className='mt-2 mx-4 sm:mx-6 md:mx-8 pt-4 border-t flex flex-shrink-0 flex-row-reverse'>
          {footerActionButtons}
        </div>
      )}
    </div>
  )
}

export default SimpleView
