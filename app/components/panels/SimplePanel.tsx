import React from 'react'
// utils
import { classNames } from '../../helpers/class-helper'

const SimplePanel: React.FC<any> = ({
  children,
  className,
  title,
  subtitle,
  actionsButtons,
}: any) => {
  return (
    <div className={classNames('bg-white shadow rounded-lg divide-y divide-gray-200', className)}>
      {(title || subtitle || actionsButtons) && (
        <div
          className={classNames('px-4 sm:px-6', actionsButtons ? 'pt-[13px] pb-[13px]' : 'py-5')}
        >
          <div className='-ml-4 -mt-4 flex justify-between items-center flex-wrap sm:flex-nowrap'>
            <div className='ml-4 mt-4'>
              <h3 className='text-lg leading-6 font-medium text-gray-900'>{title}</h3>
              {subtitle && <p className='mt-1 max-w-2xl text-sm text-gray-500'>{subtitle}</p>}
            </div>
            <div className='ml-4 mt-4 flex-shrink-0'>{actionsButtons && actionsButtons}</div>
          </div>
        </div>
      )}
      <div className='px-4 py-5 sm:p-6'>{children}</div>
    </div>
  )
}

export default SimplePanel
