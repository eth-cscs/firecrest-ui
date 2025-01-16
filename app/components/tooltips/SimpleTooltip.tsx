import { classNames } from '~/helpers/class-helper'

const SimpleTooltip: React.FC<any> = ({ children, message, className = '' }: any) => {
  return (
    <div className='group relative inline-flex'>
      {children}
      <span
        className={classNames(
          'absolute min-w-fit z-50 top-6 scale-0 transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100',
          className,
        )}
      >
        {message}
      </span>
    </div>
  )
}

export default SimpleTooltip
