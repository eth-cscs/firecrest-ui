import { ReactNode } from 'react'
// types
import { classNames } from '~/helpers/class-helper'

interface LeftTitleCardProps {
  children: ReactNode
  title: string
  subtitle?: string
  className?: string
}

const LeftTitleCard: React.FC<LeftTitleCardProps> = ({
  children,
  title,
  subtitle = undefined,
  className = '',
}: LeftTitleCardProps) => {
  return (
    <div
      className={classNames(
        'grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-x-8 gap-y-10 pb-8',
        className,
      )}
    >
      <div className=''>
        <h2 className='text-base font-semibold leading-7 text-gray-900'>{title}</h2>
        {subtitle && <p className='mt-1 text-sm leading-6 text-gray-600'>{subtitle}</p>}
      </div>
      <div className='md:col-span-2 xl:col-span-4'>{children}</div>
    </div>
  )
}

export default LeftTitleCard
