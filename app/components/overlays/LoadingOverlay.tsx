import React from 'react'

const LoadingOverlay: React.FC<any> = ({ title = null, subtitle = null }: any) => {
  return (
    <div className='c-loading_spinner absolute top-0 left-0 right-0 bottom-0 z-50 overflow-hidden bg-gray-300 opacity-75 flex flex-col items-center justify-center'>
      <div className='c-loading_spinner-loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4' />
      <h2 className='text-center text-black text-xl'>{title || 'Loading...'}</h2>
      {subtitle && <p className='w-1/3 text-center text-black'>{subtitle}</p>}
    </div>
  )
}

export default LoadingOverlay
